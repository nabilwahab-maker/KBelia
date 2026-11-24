import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  User, 
  ShieldCheck, 
  FileText, 
  Phone, 
  Mail, 
  MapPin, 
  Briefcase, 
  Store, 
  CheckCircle2, 
  Check, 
  AlertCircle, 
  Save, 
  Sliders, 
  RefreshCw, 
  Database,
  Camera,
  Upload,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  Bell,
  Landmark,
  Clock,
  Share2,
  Download,
  Sparkles,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Sun,
  Moon,
  Globe,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { BusinessListing, BusinessCategory, KelantanDistrict, formatBusinessCategory } from '../types';
import { saveBusinessListing, seedInitialData, loadLocalPortalSettings, savePortalSettingsRecord } from '../services/dataService';
import confetti from 'canvas-confetti';
import { ToggleSwitch } from './ToggleSwitch';
import { Accordion } from './Accordion';
import { showToast } from './ToastNotification';
import { useConfirmDelete } from '../context/ConfirmDeleteContext';
import { getRoleTheme, DashboardRole } from '../utils/roleTheme';

interface SettingsPageProps {
  myBusiness: BusinessListing | null;
  onRefresh: () => void;
}

const CATEGORIES: BusinessCategory[] = [
  'Makanan & Minuman (F&B)',
  'Fesyen, Batik & Kraf Kelantan',
  'Teknologi & Servis Digital',
  'Kecantikan & Kesihatan',
  'Pertanian & Agrotek',
  'Runcit & Gaya Hidup'
];

const DISTRICTS: KelantanDistrict[] = [
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

const BANK_OPTIONS = [
  'Maybank (Malayan Banking Berhad)',
  'Bank Islam Malaysia Berhad',
  'CIMB Bank Berhad',
  'RHB Bank Berhad',
  'Bank Muamalat Malaysia',
  'Bank Simpanan Nasional (BSN)',
  'Public Bank Berhad',
  'AmBank (M) Berhad',
  'Agrobank (Bank Pertanian Malaysia)',
  'Bank Kerjasama Rakyat Malaysia (Bank Rakyat)',
  'Hong Leong Bank'
];

export const SettingsPage: React.FC<SettingsPageProps> = ({ myBusiness, onRefresh }) => {
  const { user, userProfile, updateProfileData, changeUserPassword, isAdmin } = useAuth();
  const { theme, isDark, toggleTheme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { confirmDelete } = useConfirmDelete();

  // Role detection: youth vs mentor vs admin
  const isMentor = userProfile?.role === 'mentor';
  const isYouth = !isAdmin && !isMentor;
  const dashboardRole: DashboardRole = isAdmin ? 'admin' : isMentor ? 'mentor' : 'belia';
  const roleTheme = getRoleTheme(dashboardRole);

  // Navigation Filter Tab within Settings
  const [activeSection, setActiveSection] = useState<'all' | 'theme' | 'language' | 'profile' | 'business' | 'banking' | 'notifications' | 'security' | 'admin'>('all');

  // 1. Profile & Avatar States
  const [settingsAvatarUrl, setSettingsAvatarUrl] = useState<string>(
    userProfile?.avatarUrl || user?.photoURL || ''
  );
  const [settingsFullName, setSettingsFullName] = useState(userProfile?.fullName || user?.displayName || '');
  const [settingsIcNumber, setSettingsIcNumber] = useState(userProfile?.icNumber || '');
  const [settingsPhone, setSettingsPhone] = useState(userProfile?.phone || userProfile?.whatsapp || myBusiness?.whatsapp || '');
  const [settingsDistrict, setSettingsDistrict] = useState<KelantanDistrict>((userProfile?.district as KelantanDistrict) || myBusiness?.district || 'Kota Bharu');

  // Mentor Specific States (Non-business)
  const [mentorExpertise, setMentorExpertise] = useState(userProfile?.expertise || 'Pemasaran Digital & E-Dagang');
  const [mentorDepartment, setMentorDepartment] = useState(userProfile?.department || 'Unit Bimbingan & Keusahawanan Hab Usahawan KBelia');

  // 2. Business & Brand States
  const [settingsLogoUrl, setSettingsLogoUrl] = useState<string>(userProfile?.logoUrl || myBusiness?.logoUrl || '');
  const [settingsBusinessName, setSettingsBusinessName] = useState(userProfile?.businessName || myBusiness?.businessName || '');
  const [settingsCategory, setSettingsCategory] = useState<BusinessCategory>(userProfile?.category || myBusiness?.category || 'Makanan & Minuman (F&B)');
  const [settingsSsmStatus, setSettingsSsmStatus] = useState<'registered' | 'in_progress' | 'not_registered'>(
    userProfile?.ssmStatus || (myBusiness?.ssmNumber ? 'registered' : 'in_progress')
  );
  const [settingsSsmNumber, setSettingsSsmNumber] = useState(userProfile?.ssmNumber || myBusiness?.ssmNumber || '');
  const [settingsBusinessStage, setSettingsBusinessStage] = useState<'idea' | 'startup' | 'growth'>(
    userProfile?.businessStage || 'startup'
  );
  const [settingsBusinessHours, setSettingsBusinessHours] = useState(userProfile?.businessHours || myBusiness?.businessHours || 'Setiap Hari: 9.00 PG - 10.00 MLM');
  const [settingsBusinessAddress, setSettingsBusinessAddress] = useState(userProfile?.businessAddress || myBusiness?.businessAddress || '');

  // 3. Social Media States
  const [settingsFacebook, setSettingsFacebook] = useState(userProfile?.facebook || myBusiness?.facebook || '');
  const [settingsInstagram, setSettingsInstagram] = useState(userProfile?.instagram || myBusiness?.instagram || '');
  const [settingsTiktok, setSettingsTiktok] = useState(userProfile?.tiktok || myBusiness?.tiktok || '');

  // 4. Banking States
  const [settingsBankName, setSettingsBankName] = useState(userProfile?.bankName || myBusiness?.bankName || 'Maybank (Malayan Banking Berhad)');
  const [settingsBankAccountNumber, setSettingsBankAccountNumber] = useState(userProfile?.bankAccountNumber || myBusiness?.bankAccountNumber || '');
  const [settingsBankAccountHolder, setSettingsBankAccountHolder] = useState(userProfile?.bankAccountHolder || '');

  // 5. Notifications & Privacy States
  const [settingsNotifyWhatsApp, setSettingsNotifyWhatsApp] = useState<boolean>(userProfile?.notifyWhatsApp ?? true);
  const [settingsNotifyEmail, setSettingsNotifyEmail] = useState<boolean>(userProfile?.notifyEmail ?? true);
  const [settingsHidePhonePublic, setSettingsHidePhonePublic] = useState<boolean>(userProfile?.hidePhonePublic ?? false);
  const [settingsBusinessStatus, setSettingsBusinessStatus] = useState<'active' | 'temporary_closed'>(userProfile?.businessStatus || 'active');

  // 6. Password Change States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Status & Feedback
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile Completeness Progress (PRD Item 16)
  const completeness = useMemo(() => {
    const items = [
      { key: 'avatar', label: language === 'en' ? 'Profile Photo' : 'Foto Profil', done: !!settingsAvatarUrl },
      { key: 'name', label: language === 'en' ? 'Full Name' : 'Nama Penuh', done: !!settingsFullName },
      { key: 'phone', label: language === 'en' ? 'Phone Number' : 'Nombor Telefon', done: !!settingsPhone },
      { key: 'bizName', label: language === 'en' ? 'Business Name' : 'Nama Bisnes', done: !!settingsBusinessName },
      { key: 'category', label: language === 'en' ? 'Category' : 'Kategori', done: !!settingsCategory },
      { key: 'ssm', label: language === 'en' ? 'SSM Registration' : 'Pendaftaran SSM', done: !!settingsSsmNumber },
      { key: 'bank', label: language === 'en' ? 'Bank Account' : 'Akaun Bank', done: !!(settingsBankName && settingsBankAccountNumber) },
    ];
    let completedCount = 0;
    items.forEach(i => { if (i.done) completedCount += 1; });
    const percent = Math.round((completedCount / items.length) * 100);
    const nextItem = items.find(i => !i.done);
    return { percent, nextItem, items, completedCount, totalCount: items.length };
  }, [settingsAvatarUrl, settingsFullName, settingsPhone, settingsBusinessName, settingsCategory, settingsSsmNumber, settingsBankName, settingsBankAccountNumber, language]);

  // Hidden File Inputs Refs
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // Admin Settings State (if admin)
  const initialPortalSettings = useMemo(() => loadLocalPortalSettings(), []);
  const [adminOfficerName, setAdminOfficerName] = useState(
    initialPortalSettings.adminOfficerName || 'Pentadbir Nabil (Admin KBelia)'
  );
  const [adminHelpdeskPhone, setAdminHelpdeskPhone] = useState(
    initialPortalSettings.adminHelpdeskPhone || '+6011-2050 8890'
  );
  const [portalSubsidyRate, setPortalSubsidyRate] = useState(
    String(initialPortalSettings.portalSubsidyRate ?? 50)
  );
  const [maxLeaseDurationMonths, setMaxLeaseDurationMonths] = useState(
    String(initialPortalSettings.maxLeaseDurationMonths ?? 12)
  );
  const [portalAnnouncement, setPortalAnnouncement] = useState(
    initialPortalSettings.portalAnnouncement || 'Permohonan Kiosk Belia & Geran Belia Kelantan Kini Dibuka!'
  );

  // Sync settings state if userProfile or myBusiness changes
  useEffect(() => {
    if (userProfile) {
      if (userProfile.avatarUrl) setSettingsAvatarUrl(userProfile.avatarUrl);
      else if (user?.photoURL && !settingsAvatarUrl) setSettingsAvatarUrl(user.photoURL);

      if (userProfile.fullName) setSettingsFullName(userProfile.fullName);
      if (userProfile.icNumber) setSettingsIcNumber(userProfile.icNumber);
      if (userProfile.phone) setSettingsPhone(userProfile.phone);
      if (userProfile.district) setSettingsDistrict(userProfile.district as KelantanDistrict);

      if (userProfile.logoUrl) setSettingsLogoUrl(userProfile.logoUrl);
      if (userProfile.businessName) setSettingsBusinessName(userProfile.businessName);
      if (userProfile.category) setSettingsCategory(userProfile.category);
      if (userProfile.ssmStatus) setSettingsSsmStatus(userProfile.ssmStatus);
      if (userProfile.ssmNumber) setSettingsSsmNumber(userProfile.ssmNumber);
      if (userProfile.businessStage) setSettingsBusinessStage(userProfile.businessStage);
      if (userProfile.businessHours) setSettingsBusinessHours(userProfile.businessHours);
      if (userProfile.businessAddress) setSettingsBusinessAddress(userProfile.businessAddress);

      if (userProfile.facebook) setSettingsFacebook(userProfile.facebook);
      if (userProfile.instagram) setSettingsInstagram(userProfile.instagram);
      if (userProfile.tiktok) setSettingsTiktok(userProfile.tiktok);

      if (userProfile.bankName) setSettingsBankName(userProfile.bankName);
      if (userProfile.bankAccountNumber) setSettingsBankAccountNumber(userProfile.bankAccountNumber);
      if (userProfile.bankAccountHolder) setSettingsBankAccountHolder(userProfile.bankAccountHolder);

      if (userProfile.department) setMentorDepartment(userProfile.department);
      if (userProfile.expertise) setMentorExpertise(userProfile.expertise);

      if (typeof userProfile.notifyWhatsApp === 'boolean') setSettingsNotifyWhatsApp(userProfile.notifyWhatsApp);
      if (typeof userProfile.notifyEmail === 'boolean') setSettingsNotifyEmail(userProfile.notifyEmail);
      if (typeof userProfile.hidePhonePublic === 'boolean') setSettingsHidePhonePublic(userProfile.hidePhonePublic);
      if (userProfile.businessStatus) setSettingsBusinessStatus(userProfile.businessStatus);
    } else if (user?.displayName) {
      setSettingsFullName(user.displayName);
      if (user.photoURL && !settingsAvatarUrl) setSettingsAvatarUrl(user.photoURL);
    }

    // Only sync business data for youth entrepreneurs
    if (myBusiness && isYouth) {
      if (!settingsLogoUrl && myBusiness.logoUrl) setSettingsLogoUrl(myBusiness.logoUrl);
      if (!userProfile?.businessName && myBusiness.businessName) setSettingsBusinessName(myBusiness.businessName);
      if (!userProfile?.ssmNumber && myBusiness.ssmNumber) setSettingsSsmNumber(myBusiness.ssmNumber);
      if (!userProfile?.category && myBusiness.category) setSettingsCategory(myBusiness.category);
      if (!userProfile?.phone && myBusiness.whatsapp) setSettingsPhone(myBusiness.whatsapp);
      if (!settingsInstagram && myBusiness.instagram) setSettingsInstagram(myBusiness.instagram);
      if (!settingsTiktok && myBusiness.tiktok) setSettingsTiktok(myBusiness.tiktok);
      if (!settingsFacebook && myBusiness.facebook) setSettingsFacebook(myBusiness.facebook);
    }
  }, [userProfile, user, myBusiness, isYouth]);

  // Handler: Sync with Google Profile Photo
  const handleSyncGooglePhoto = () => {
    if (user?.photoURL) {
      setSettingsAvatarUrl(user.photoURL);
      setSettingsMessage({
        type: 'success',
        text: 'Gambar profil berjaya diselaraskan dengan gambar akaun Google anda! Klik "Simpan Semua Tetapan" untuk kekalkan.'
      });
    } else {
      setSettingsMessage({
        type: 'error',
        text: 'Akaun semasa tiada pautan foto profil Google. Sila gunakan pilihan "Muat Naik Gambar Peribadi".'
      });
    }
  };

  // Handler: Upload Avatar from Local File & Auto-Save
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setSettingsMessage({ type: 'error', text: 'Saiz fail gambar melebihi 2MB. Sila pilih gambar yang lebih kecil.' });
        return;
      }
      const reader = new FileReader();
      reader.onload = async () => {
        if (typeof reader.result === 'string') {
          const newAvatar = reader.result;
          setSettingsAvatarUrl(newAvatar);
          try {
            await updateProfileData({ avatarUrl: newAvatar });
            setSettingsMessage({
              type: 'success',
              text: 'Gambar profil baharu berjaya dipilih dan disimpan secara automatik!'
            });
            showToast('Foto profil berjaya dikemaskini dan disimpan!');
          } catch (err) {
            setSettingsMessage({
              type: 'success',
              text: 'Gambar profil berjaya dipilih! Klik "Simpan Perubahan" untuk mengesahkan.'
            });
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handler: Upload Business Logo
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setSettingsMessage({ type: 'error', text: 'Saiz logo melebihi 2MB. Sila pilih fail yang lebih kecil.' });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setSettingsLogoUrl(reader.result);
          setSettingsMessage({
            type: 'success',
            text: 'Logo perniagaan berjaya dimuat naik! Klik "Simpan Semua Tetapan" untuk menyimpan.'
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handler: Change Password Submit
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordNotice(null);

    if (!currentPassword.trim()) {
      setPasswordNotice({ 
        type: 'error', 
        text: language === 'ms' 
          ? 'Sila masukkan kata laluan semasa / lama anda terlebih dahulu.' 
          : 'Please enter your current / old password first.' 
      });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordNotice({ 
        type: 'error', 
        text: language === 'ms' 
          ? 'Kata laluan baharu mestilah sekurang-kurangnya 6 aksara.' 
          : 'New password must be at least 6 characters.' 
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordNotice({ 
        type: 'error', 
        text: language === 'ms' 
          ? 'Pengesahan kata laluan baharu tidak sepadan.' 
          : 'Password confirmation does not match.' 
      });
      return;
    }

    try {
      setIsChangingPassword(true);
      const res = await changeUserPassword(newPassword, currentPassword);
      if (res.success) {
        setPasswordNotice({ 
          type: 'success', 
          text: language === 'ms' 
            ? 'Kata laluan anda telah berjaya dikemas kini!' 
            : 'Your password has been updated successfully!' 
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordNotice({ type: 'error', text: res.error || (language === 'ms' ? 'Gagal menukar kata laluan.' : 'Failed to change password.') });
      }
    } catch (err: any) {
      setPasswordNotice({ type: 'error', text: err?.message || (language === 'ms' ? 'Ralat semasa menukar kata laluan.' : 'Error changing password.') });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handler: Main Settings Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsFullName.trim()) {
      setSettingsMessage({ type: 'error', text: 'Sila masukkan nama penuh anda.' });
      return;
    }
    if (!settingsPhone.trim()) {
      setSettingsMessage({ type: 'error', text: 'Sila masukkan nombor telefon / WhatsApp rasmi.' });
      return;
    }

    try {
      setSavingSettings(true);
      setSettingsMessage(null);

      if (isYouth) {
        // 1. Update AuthContext profile for Youth (with Business & Banking)
        await updateProfileData({
          avatarUrl: settingsAvatarUrl,
          logoUrl: settingsLogoUrl,
          fullName: settingsFullName.trim(),
          icNumber: settingsIcNumber.trim(),
          phone: settingsPhone.trim(),
          whatsapp: settingsPhone.trim(),
          district: settingsDistrict,
          businessName: settingsBusinessName.trim(),
          category: settingsCategory,
          ssmStatus: settingsSsmStatus,
          ssmNumber: settingsSsmNumber.trim(),
          businessStage: settingsBusinessStage,
          businessHours: settingsBusinessHours.trim(),
          businessAddress: settingsBusinessAddress.trim(),
          facebook: settingsFacebook.trim(),
          instagram: settingsInstagram.trim(),
          tiktok: settingsTiktok.trim(),
          bankName: settingsBankName,
          bankAccountNumber: settingsBankAccountNumber.trim(),
          bankAccountHolder: settingsBankAccountHolder.trim() || settingsFullName.trim(),
          notifyWhatsApp: settingsNotifyWhatsApp,
          notifyEmail: settingsNotifyEmail,
          hidePhonePublic: settingsHidePhonePublic,
          businessStatus: settingsBusinessStatus
        });

        // 2. Also keep business listing in sync if existing
        if (myBusiness) {
          await saveBusinessListing({
            ...myBusiness,
            ownerName: settingsFullName.trim(),
            ownerPhone: settingsPhone.trim(),
            whatsapp: settingsPhone.trim(),
            district: settingsDistrict,
            businessName: settingsBusinessName.trim() || myBusiness.businessName,
            category: settingsCategory,
            ssmNumber: settingsSsmNumber.trim(),
            logoUrl: settingsLogoUrl || myBusiness.logoUrl,
            facebook: settingsFacebook.trim(),
            instagram: settingsInstagram.trim(),
            tiktok: settingsTiktok.trim(),
            bankName: settingsBankName,
            bankAccountNumber: settingsBankAccountNumber.trim(),
            businessHours: settingsBusinessHours.trim(),
            businessAddress: settingsBusinessAddress.trim()
          });
        }

        confetti({ particleCount: 50, spread: 60 });
        setSettingsMessage({ 
          type: 'success', 
          text: language === 'en' ? 'Profile, business details, and banking information saved successfully!' : 'Semua tetapan maklumat profil, bisnes, perbankan, dan notifikasi berjaya disimpan!' 
        });
        showToast({
          type: 'success',
          title: language === 'en' ? 'Profile & Settings Updated!' : 'Profil & Tetapan Dikemas Kini!',
          message: language === 'en' ? 'Your business and youth profile details were saved successfully.' : 'Perubahan maklumat usahawan dan premis anda telah disimpan dengan jayanya.'
        });
      } else if (isMentor) {
        // Mentor profile update: only personal & mentor academic info
        await updateProfileData({
          avatarUrl: settingsAvatarUrl,
          fullName: settingsFullName.trim(),
          icNumber: settingsIcNumber.trim(),
          phone: settingsPhone.trim(),
          whatsapp: settingsPhone.trim(),
          district: settingsDistrict,
          department: mentorDepartment.trim(),
          expertise: mentorExpertise.trim(),
          notifyWhatsApp: settingsNotifyWhatsApp,
          notifyEmail: settingsNotifyEmail,
          hidePhonePublic: settingsHidePhonePublic
        });

        confetti({ particleCount: 40, spread: 50 });
        setSettingsMessage({ 
          type: 'success', 
          text: language === 'en' ? 'Mentor profile and focus updated successfully!' : 'Profil mentor dan bidang pengkhususan bimbingan KBelia berjaya dikemaskini!' 
        });
        showToast({
          type: 'success',
          title: language === 'en' ? 'Mentor Profile Saved!' : 'Profil Mentor Disimpan!',
          message: language === 'en' ? 'Your official mentoring profile has been updated.' : 'Maklumat bimbingan dan kepakaran anda telah dikemas kini.'
        });
      } else {
        // Admin profile update: admin details and system configs
        await updateProfileData({
          avatarUrl: settingsAvatarUrl,
          fullName: settingsFullName.trim(),
          phone: settingsPhone.trim(),
          district: settingsDistrict,
          notifyWhatsApp: settingsNotifyWhatsApp,
          notifyEmail: settingsNotifyEmail
        });

        const currentPortal = loadLocalPortalSettings();
        await savePortalSettingsRecord({
          ...currentPortal,
          adminOfficerName: adminOfficerName.trim() || 'Pentadbir KBelia',
          adminHelpdeskPhone: adminHelpdeskPhone.trim() || '+6011-2050 8890',
          portalSubsidyRate: Number(portalSubsidyRate) || 50,
          maxLeaseDurationMonths: Number(maxLeaseDurationMonths) || 12,
          portalAnnouncement: portalAnnouncement.trim()
        });

        setSettingsMessage({ 
          type: 'success', 
          text: language === 'en' ? 'System administrator profile and portal configurations saved successfully!' : 'Tetapan pentadbir sistem dan konfigurasi portal berjaya disimpan!' 
        });
        showToast({
          type: 'success',
          title: language === 'en' ? 'Admin Settings Saved!' : 'Tetapan Pentadbir Disimpan!',
          message: language === 'en' ? 'System preferences and administrator profile updated.' : 'Profil pentadbir dan konfigurasi sistem telah dikemas kini.'
        });
      }

      onRefresh();
    } catch (err) {
      console.error(err);
      setSettingsMessage({ type: 'error', text: 'Gagal menyimpan tetapan. Sila cuba lagi.' });
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div id="kbelia-settings-module" className="w-full space-y-4">
      
      {/* 1. Header Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${roleTheme.surfaceClass}`}>
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black text-black dark:text-white tracking-tight">
            {t('settings_title')}
          </h1>
          <p className="text-[0.9375rem] text-black/75 dark:text-white/75 max-w-2xl leading-relaxed">
            {t('settings_desc')}
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className={`px-3 py-1.5 border rounded-xl text-sm font-semibold flex items-center gap-1.5 ${roleTheme.activeMiniBtnClass}`}>
            <ShieldCheck className="w-4 h-4 shrink-0" />
            {isAdmin 
              ? t('settings_superadmin_badge') 
              : isMentor 
              ? (language === 'en' ? 'KBelia Mentor' : 'Mentor Bimbingan KBelia') 
              : t('settings_verified_account')}
          </span>
        </div>
      </div>

      {/* Profile Completeness Card (PRD Item 16 - Khusus Usahawan Belia) */}
      {isYouth && (
        <div className={`p-4 sm:p-5 rounded-2xl border ${roleTheme.surfaceClass}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className={`w-4 h-4 ${roleTheme.accentTextClass}`} />
              <span className="text-sm sm:text-[0.9375rem] font-bold text-black dark:text-white">
                {language === 'en' ? 'Profile & Business Completeness' : 'Tahap Kelengkapan Profil & Bisnes'}
              </span>
            </div>
            <span className={`text-[0.8125rem] font-mono font-extrabold ${roleTheme.accentTextClass}`}>
              {completeness.percent}% {language === 'en' ? 'Completed' : 'Lengkap'}
            </span>
          </div>
          <div className={`w-full h-2.5 border ${roleTheme.dividerClass} ${roleTheme.surfaceMutedClass} rounded-full overflow-hidden mb-2`}>
            <div 
              className={`h-full rounded-full transition-all duration-500 ease-out ${roleTheme.progressFillClass}`}
              style={{ width: `${completeness.percent}%` }}
            />
          </div>
          {completeness.nextItem ? (
            <p className="text-[0.875rem] text-black/80 dark:text-white/80">
              {language === 'en' 
                ? `Tip: Complete your "${completeness.nextItem.label}" to achieve 100% eligibility for State Youth Grants.` 
                : `Tip: Lengkapkan "${completeness.nextItem.label}" anda untuk capai 100% kelayakan Geran Belia Negeri.`}
            </p>
          ) : (
            <p className={`text-[0.875rem] font-semibold flex items-center gap-1 ${roleTheme.accentTextClass}`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Congratulations! Your profile is 100% complete and fully verified.' : 'Tahniah! Profil perniagaan anda 100% lengkap dan disahkan.'}</span>
            </p>
          )}
        </div>
      )}

      {/* 2. Interactive Navigation Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-sm font-bold">
        <button
          type="button"
          onClick={() => setActiveSection('all')}
          className={`px-3.5 py-2 rounded-xl transition-all shrink-0 cursor-pointer ${
            activeSection === 'all'
              ? roleTheme.segmentedActiveClass
              : roleTheme.secondaryButtonClass
          }`}
        >
          {t('tab_all')}
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('theme')}
          className={`px-3.5 py-2 rounded-xl transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
            activeSection === 'theme'
              ? roleTheme.segmentedActiveClass
              : roleTheme.secondaryButtonClass
          }`}
        >
          {isDark ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
          <span>{t('tab_theme')}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('language')}
          className={`px-3.5 py-2 rounded-xl transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
            activeSection === 'language'
              ? roleTheme.segmentedActiveClass
              : roleTheme.secondaryButtonClass
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{t('tab_language')}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('profile')}
          className={`px-3.5 py-2 rounded-xl transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
            activeSection === 'profile'
              ? roleTheme.segmentedActiveClass
              : roleTheme.secondaryButtonClass
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>{t('tab_profile')}</span>
        </button>
        {isYouth && (
          <button
            type="button"
            onClick={() => setActiveSection('business')}
            className={`px-3.5 py-2 rounded-xl transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeSection === 'business'
                ? roleTheme.segmentedActiveClass
                : roleTheme.secondaryButtonClass
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>{t('tab_business')}</span>
          </button>
        )}
        {isYouth && (
          <button
            type="button"
            onClick={() => setActiveSection('banking')}
            className={`px-3.5 py-2 rounded-xl transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeSection === 'banking'
                ? roleTheme.segmentedActiveClass
                : roleTheme.secondaryButtonClass
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>{t('tab_banking')}</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => setActiveSection('notifications')}
          className={`px-3.5 py-2 rounded-xl transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
            activeSection === 'notifications'
              ? roleTheme.segmentedActiveClass
              : roleTheme.secondaryButtonClass
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>{t('tab_notifications')}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('security')}
          className={`px-3.5 py-2 rounded-xl transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
            activeSection === 'security'
              ? roleTheme.segmentedActiveClass
              : roleTheme.secondaryButtonClass
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>{t('tab_security')}</span>
        </button>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setActiveSection('admin')}
            className={`px-3.5 py-2 rounded-xl transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeSection === 'admin'
                ? roleTheme.segmentedActiveClass
                : roleTheme.secondaryButtonClass
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{t('tab_admin')}</span>
          </button>
        )}
      </div>

      {/* 3. Global Feedback Alert */}
      {settingsMessage && (
        <div className={`p-4 rounded-xl text-sm font-semibold flex items-center justify-between shadow-xs transition-all ${
          settingsMessage.type === 'success'
            ? 'bg-emerald-50 text-black border border-emerald-300'
            : 'bg-rose-50 text-black border border-rose-300'
        }`}>
          <div className="flex items-center gap-2.5">
            {settingsMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-black dark:text-white shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-black dark:text-white shrink-0" />
            )}
            <span>{settingsMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setSettingsMessage(null)}
            className="text-sm font-bold opacity-60 hover:opacity-100 px-2 py-0.5"
          >
            ×
          </button>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={avatarFileInputRef}
        onChange={handleAvatarFileChange}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={logoFileInputRef}
        onChange={handleLogoFileChange}
        accept="image/*"
        className="hidden"
      />

      <form onSubmit={handleSaveSettings} className="space-y-6">

        {/* ======================================================== */}
        {/* SEKSYEN 0: TEMA & MOD GELAP                             */}
        {/* ======================================================== */}
        {(activeSection === 'all' || activeSection === 'theme') && (
          <div className={`p-4 sm:p-5 rounded-2xl border transition-colors space-y-4 ${roleTheme.surfaceClass}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-black dark:text-white tracking-tight">{t('theme_display_title')}</h3>
              </div>

              {/* Compact Horizontal Segmented Tab Control */}
              <div className={`inline-flex items-center p-1 rounded-xl border ${roleTheme.dividerClass} ${roleTheme.surfaceMutedClass} shrink-0 self-start sm:self-auto`}>
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                    !isDark
                      ? roleTheme.segmentedActiveClass
                      : 'text-black/75 dark:text-white/75 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  <span>{t('mode_light_btn')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                    isDark
                      ? roleTheme.segmentedActiveClass
                      : 'text-black/75 dark:text-white/75 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  <span>{t('mode_dark_btn')}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SEKSYEN: PILIHAN BAHASA / LANGUAGE SELECTION            */}
        {/* ======================================================== */}
        {(activeSection === 'all' || activeSection === 'theme' || activeSection === 'language') && (
          <div className={`p-4 sm:p-5 rounded-2xl border transition-colors ${roleTheme.surfaceClass}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Globe className={`w-4 h-4 ${roleTheme.accentTextClass}`} />
                  <h3 className="text-base sm:text-lg font-extrabold text-black dark:text-white tracking-tight">
                    {t('lang_setting_title')}
                  </h3>
                </div>
              </div>

              {/* Language Segmented Control */}
              <div className={`inline-flex items-center p-1 rounded-xl border ${roleTheme.dividerClass} ${roleTheme.surfaceMutedClass} shrink-0 self-start sm:self-auto`}>
                <button
                  type="button"
                  id="btn-switch-lang-ms"
                  onClick={() => {
                    setLanguage('ms');
                    showToast('Bahasa sistem ditetapkan kepada Bahasa Melayu (Rasmi)');
                  }}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                    language === 'ms'
                      ? roleTheme.segmentedActiveClass
                      : 'text-black/75 dark:text-white/75 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <span className="text-sm">🇲🇾</span>
                  <span>Bahasa Melayu</span>
                </button>

                <button
                  type="button"
                  id="btn-switch-lang-en"
                  onClick={() => {
                    setLanguage('en');
                    showToast('System language set to English (International)');
                  }}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                    language === 'en'
                      ? roleTheme.segmentedActiveClass
                      : 'text-black/75 dark:text-white/75 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <span className="text-sm">🌐</span>
                  <span>English</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SEKSYEN 1: FOTO PROFIL & SERASI GAMBAR GOOGLE */}
        {/* ======================================================== */}
        {(activeSection === 'all' || activeSection === 'profile') && (
          <div className={`p-6 sm:p-7 rounded-2xl border space-y-6 transition-colors ${roleTheme.surfaceClass}`}>
            <div className={`flex items-center pb-3 border-b ${roleTheme.dividerClass}`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center font-bold ${roleTheme.activeMiniBtnClass}`}>
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-black dark:text-white tracking-tight">{t('settings_profile_avatar_title')}</h3>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              
              {/* Avatar Preview Box */}
              <div className="relative group shrink-0">
                <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 ${roleTheme.dividerClass} ${roleTheme.surfaceMutedClass} flex items-center justify-center`}>
                  {settingsAvatarUrl ? (
                    <img
                      src={settingsAvatarUrl}
                      alt="Avatar Profil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full font-black text-3xl flex items-center justify-center ${roleTheme.primaryButtonClass}`}>
                      {settingsFullName.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                {/* Floating camera icon */}
                <button
                  type="button"
                  onClick={() => avatarFileInputRef.current?.click()}
                  className={`absolute -bottom-2 -right-2 p-2 rounded-xl shadow-md border-2 border-white dark:border-stone-900 transition-all hover:scale-105 cursor-pointer ${roleTheme.primaryButtonClass}`}
                  title={language === 'ms' ? "Tukar foto profil" : "Change profile photo"}
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Avatar Controls & Google Sync Actions */}
              <div className="flex-1 space-y-3 text-center sm:text-left">
                <div>
                  <div className="font-bold text-black dark:text-white text-sm">
                    {settingsFullName || (
                      isAdmin 
                        ? (language === 'ms' ? 'Pentadbir Sistem Pentadbiran' : 'System Administrator')
                        : isMentor
                        ? (language === 'ms' ? 'Mentor Bimbingan KBelia' : 'KBelia Mentor')
                        : (language === 'ms' ? 'Usahawan Belia Kelantan' : 'Kelantan Youth Entrepreneur')
                    )}
                  </div>
                  <div className="text-sm text-black/70 dark:text-white/75 mt-0.5">
                    {user?.email || t('settings_verified_account')} · {
                      isAdmin
                        ? (language === 'ms' ? 'Pentadbir Sistem Kerajaan Negeri' : 'State System Administrator')
                        : isMentor
                        ? `${mentorDepartment}`
                        : (language === 'ms' ? `Jajahan ${settingsDistrict}` : `${settingsDistrict} District`)
                    }
                  </div>
                </div>

                <div className="pt-1">
                  <p className="text-[0.9375rem] text-black dark:text-white max-w-md leading-relaxed">
                    {t('settings_avatar_help')}
                  </p>
                </div>

                <p className="text-[0.875rem] text-black/70 dark:text-white/75">
                  {t('settings_avatar_specs')}
                </p>
              </div>

            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SEKSYEN 2: MAKLUMAT PERIBADI & HUBUNGAN */}
        {/* ======================================================== */}
        {(activeSection === 'all' || activeSection === 'profile') && (
          <div className={`p-6 sm:p-7 rounded-2xl border space-y-5 transition-colors ${roleTheme.surfaceClass}`}>
            <div className={`flex items-center gap-2.5 pb-3 border-b ${roleTheme.dividerClass}`}>
              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold ${roleTheme.activeMiniBtnClass}`}>
                <User className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-extrabold text-black dark:text-white tracking-tight">{t('settings_personal_info_title')}</h4>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nama Penuh */}
              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                  {t('settings_full_name')} <span className="text-black dark:text-white/75">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-black/60 dark:text-white/65 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={settingsFullName}
                    onChange={(e) => setSettingsFullName(e.target.value)}
                    placeholder={t('settings_full_name_ph')}
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-sm font-medium focus:outline-hidden transition-all ${roleTheme.inputClass}`}
                  />
                </div>
              </div>

              {/* No. MyKad */}
              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                  {t('settings_ic_number')}
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-black/60 dark:text-white/65 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={settingsIcNumber}
                    onChange={(e) => setSettingsIcNumber(e.target.value)}
                    placeholder={t('settings_ic_number_ph')}
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-sm font-medium font-mono focus:outline-hidden transition-all ${roleTheme.inputClass}`}
                  />
                </div>
              </div>

              {/* Alamat Emel */}
              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                  {t('settings_email_registered')}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-black/60 dark:text-white/65 absolute left-3 top-3" />
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    placeholder={language === 'en' ? 'Enter email address' : 'Masukkan alamat emel'}
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-[0.9375rem] font-medium border ${roleTheme.dividerClass} ${roleTheme.surfaceMutedClass} text-black/70 dark:text-white/75 cursor-not-allowed`}
                  />
                </div>
              </div>

              {/* Nombor Telefon / WhatsApp */}
              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                  {t('settings_phone_number')} <span className="text-black dark:text-white/75">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-black/60 dark:text-white/65 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={settingsPhone}
                    onChange={(e) => setSettingsPhone(e.target.value)}
                    placeholder={t('settings_phone_number_ph')}
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-sm font-medium font-mono focus:outline-hidden transition-all ${roleTheme.inputClass}`}
                  />
                </div>
              </div>

              {/* Jajahan Operasi / Kediaman */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                  {t('settings_district_label')} <span className="text-black dark:text-white/75">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-black/60 dark:text-white/65 absolute left-3 top-3" />
                  <select
                    value={settingsDistrict}
                    onChange={(e) => setSettingsDistrict(e.target.value as KelantanDistrict)}
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-sm font-medium focus:outline-hidden transition-all ${roleTheme.inputClass}`}
                  >
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d} className="bg-white dark:bg-stone-900 text-black dark:text-white">
                        {language === 'ms' ? `Jajahan ${d}` : `${d} District`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* MAKLUMAT PENGKHUSUSAN PEMENTORAN (KHUSUS MENTOR) */}
            {isMentor && (
              <div className={`pt-4 border-t ${roleTheme.dividerClass} space-y-4`}>
                <div className="flex items-center gap-2">
                  <GraduationCap className={`w-4 h-4 ${roleTheme.accentTextClass}`} />
                  <h5 className="text-sm font-bold text-black dark:text-white uppercase tracking-wider">
                    {language === 'en' ? 'Mentor Unit & Mentoring Focus' : 'Maklumat Pengkhususan & Unit Mentor KBelia'}
                  </h5>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                      {language === 'en' ? 'Mentoring Unit' : 'Unit / Bidang Bimbingan'} <span className="text-black dark:text-white">*</span>
                    </label>
                    <input
                      type="text"
                      value={mentorDepartment}
                      onChange={(e) => setMentorDepartment(e.target.value)}
                      placeholder={language === 'en' ? 'Enter mentoring unit' : 'Masukkan unit atau jabatan bimbingan'}
                      className={`w-full px-3 py-2.5 rounded-xl text-sm font-medium focus:outline-hidden transition-all ${roleTheme.inputClass}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                      {language === 'en' ? 'Area of Expertise' : 'Bidang Kepakaran'} <span className="text-black dark:text-white">*</span>
                    </label>
                    <input
                      type="text"
                      value={mentorExpertise}
                      onChange={(e) => setMentorExpertise(e.target.value)}
                      placeholder={language === 'en' ? 'Enter area of expertise' : 'Masukkan bidang kepakaran'}
                      className={`w-full px-3 py-2.5 rounded-xl text-sm font-medium focus:outline-hidden transition-all ${roleTheme.inputClass}`}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* SEKSYEN 3: MAKLUMAT BISNES, LOGO SYARIKAT & MEDIA SOSIAL */}
        {/* ======================================================== */}
        {isYouth && (activeSection === 'all' || activeSection === 'business') && (
          <div className={`p-6 sm:p-7 rounded-2xl border space-y-6 transition-colors ${roleTheme.surfaceClass}`}>
            <div className={`flex items-center gap-2.5 pb-3 border-b ${roleTheme.dividerClass}`}>
              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold ${roleTheme.activeMiniBtnClass}`}>
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-extrabold text-black dark:text-white tracking-tight">{t('settings_business_details_title')}</h4>
              </div>
            </div>

            {/* Logo Syarikat / Jenama Box */}
            <div className={`p-4 rounded-2xl border ${roleTheme.dividerClass} ${roleTheme.surfaceMutedClass} flex flex-col sm:flex-row items-center gap-4`}>
              <div className={`w-16 h-16 rounded-xl border ${roleTheme.dividerClass} ${roleTheme.surfaceClass} overflow-hidden flex items-center justify-center shrink-0`}>
                {settingsLogoUrl ? (
                  <img src={settingsLogoUrl} alt="Logo Bisnes" className="w-full h-full object-contain p-1" />
                ) : (
                  <Store className="w-7 h-7 text-black/35 dark:text-white/35" />
                )}
              </div>
              <div className="flex-1 text-center sm:text-left space-y-1">
                <div className="text-sm font-bold text-black dark:text-white">{t('settings_business_logo_title')}</div>
                <p className="text-[0.875rem] text-black/70 dark:text-white/75">{t('settings_business_logo_desc')}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => logoFileInputRef.current?.click()}
                  className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${roleTheme.secondaryButtonClass}`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{t('settings_choose_logo_btn')}</span>
                </button>
                {settingsLogoUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      confirmDelete({
                        itemName: settingsBusinessName ? `Logo ${settingsBusinessName}` : 'Logo Perniagaan',
                        itemType: 'Logo Perniagaan',
                        onConfirm: () => setSettingsLogoUrl('')
                      })
                    }
                    className={roleTheme.iconButtonClass}
                    title={t('settings_delete_logo_btn')}
                    aria-label={t('settings_delete_logo_btn')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nama Perniagaan */}
              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                  {t('settings_business_name')}
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 text-black/60 dark:text-white/65 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={settingsBusinessName}
                    onChange={(e) => setSettingsBusinessName(e.target.value)}
                    placeholder={t('settings_business_name_ph')}
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-sm font-medium focus:outline-hidden transition-all ${roleTheme.inputClass}`}
                  />
                </div>
              </div>

              {/* Kategori Perniagaan */}
              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                  {t('settings_business_category')}
                </label>
                <select
                  value={settingsCategory}
                  onChange={(e) => setSettingsCategory(e.target.value as BusinessCategory)}
                  className={`w-full px-3 py-2.5 rounded-xl text-sm font-medium focus:outline-hidden transition-all ${roleTheme.inputClass}`}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-white dark:bg-stone-900 text-black dark:text-white">
                      {formatBusinessCategory(cat)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Pendaftaran SSM */}
              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                  {t('settings_ssm_status')}
                </label>
                <select
                  value={settingsSsmStatus}
                  onChange={(e) => setSettingsSsmStatus(e.target.value as 'registered' | 'in_progress' | 'not_registered')}
                  className={`w-full px-3 py-2.5 rounded-xl text-sm font-medium focus:outline-hidden transition-all ${roleTheme.inputClass}`}
                >
                  <option value="registered" className="bg-white dark:bg-stone-900 text-black dark:text-white">{t('settings_ssm_reg_official')}</option>
                  <option value="in_progress" className="bg-white dark:bg-stone-900 text-black dark:text-white">{t('settings_ssm_in_progress')}</option>
                  <option value="not_registered" className="bg-white dark:bg-stone-900 text-black dark:text-white">{t('settings_ssm_not_registered')}</option>
                </select>
              </div>

              {/* No. Pendaftaran SSM */}
              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                  {t('settings_ssm_number')}
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-black/60 dark:text-white/65 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={settingsSsmNumber}
                    onChange={(e) => setSettingsSsmNumber(e.target.value)}
                    placeholder={t('settings_ssm_number_ph')}
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-sm font-medium font-mono focus:outline-hidden transition-all ${roleTheme.inputClass}`}
                  />
                </div>
              </div>

              {/* Waktu Operasi */}
              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                  {t('settings_operating_hours')}
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-black/60 dark:text-white/65 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={settingsBusinessHours}
                    onChange={(e) => setSettingsBusinessHours(e.target.value)}
                    placeholder={t('settings_operating_hours_ph')}
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-sm font-medium focus:outline-hidden transition-all ${roleTheme.inputClass}`}
                  />
                </div>
              </div>

              {/* Alamat Premis / Kiosk */}
              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                  {t('settings_premise_address')}
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-black/60 dark:text-white/65 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={settingsBusinessAddress}
                    onChange={(e) => setSettingsBusinessAddress(e.target.value)}
                    placeholder={t('settings_premise_address_ph')}
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-sm font-medium focus:outline-hidden transition-all ${roleTheme.inputClass}`}
                  />
                </div>
              </div>
            </div>

            {/* Rangkaian Media Sosial */}
            <div className={`pt-3 border-t ${roleTheme.dividerClass} space-y-3`}>
              <div className="flex items-center gap-2">
                <Share2 className={`w-4 h-4 ${roleTheme.accentTextClass}`} />
                <h5 className="text-sm font-bold text-black dark:text-white uppercase tracking-wider">
                  {t('settings_social_media_title')}
                </h5>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Facebook */}
                <div>
                  <label className="block text-sm font-bold text-black dark:text-white mb-1">
                    {t('settings_facebook_label')}
                  </label>
                  <input
                    type="text"
                    value={settingsFacebook}
                    onChange={(e) => setSettingsFacebook(e.target.value)}
                    placeholder={language === 'en' ? 'Enter Facebook link' : 'Masukkan pautan Facebook'}
                    className={`w-full px-3 py-2 rounded-xl text-sm font-medium focus:outline-hidden transition-all ${roleTheme.inputClass}`}
                  />
                </div>

                {/* Instagram */}
                <div>
                  <label className="block text-sm font-bold text-black dark:text-white mb-1">
                    {t('settings_instagram_label')}
                  </label>
                  <input
                    type="text"
                    value={settingsInstagram}
                    onChange={(e) => setSettingsInstagram(e.target.value)}
                    placeholder={language === 'en' ? 'Enter Instagram username' : 'Masukkan nama akaun Instagram'}
                    className={`w-full px-3 py-2 rounded-xl text-sm font-medium focus:outline-hidden transition-all ${roleTheme.inputClass}`}
                  />
                </div>

                {/* TikTok */}
                <div>
                  <label className="block text-sm font-bold text-black dark:text-white mb-1">
                    {t('settings_tiktok_label')}
                  </label>
                  <input
                    type="text"
                    value={settingsTiktok}
                    onChange={(e) => setSettingsTiktok(e.target.value)}
                    placeholder={language === 'en' ? 'Enter TikTok username' : 'Masukkan nama akaun TikTok'}
                    className={`w-full px-3 py-2 rounded-xl text-sm font-medium focus:outline-hidden transition-all ${roleTheme.inputClass}`}
                  />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* SEKSYEN 4: AKAUN BANK PENYALURAN DANA & GERAN */}
        {/* ======================================================== */}
        {isYouth && (activeSection === 'all' || activeSection === 'banking') && (
          <div className={`p-6 sm:p-7 rounded-2xl border space-y-5 transition-colors ${roleTheme.surfaceClass}`}>
            <div className={`flex items-center gap-2.5 pb-3 border-b ${roleTheme.dividerClass}`}>
              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold ${roleTheme.activeMiniBtnClass}`}>
                <Landmark className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-extrabold text-black dark:text-white tracking-tight">{t('settings_banking_title')}</h4>
              </div>
            </div>

            <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-sm text-black dark:text-white flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold">{t('settings_privacy_assured')}</span> {t('settings_privacy_assured_desc')}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Nama Bank */}
              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                  {t('settings_bank_name')}
                </label>
                <select
                  value={settingsBankName}
                  onChange={(e) => setSettingsBankName(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl text-sm font-medium focus:outline-hidden transition-all ${roleTheme.inputClass}`}
                >
                  {BANK_OPTIONS.map((b) => (
                    <option key={b} value={b} className="bg-white dark:bg-stone-900 text-black dark:text-white">
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* No. Akaun Bank */}
              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                  {t('settings_bank_account_no')}
                </label>
                <input
                  type="text"
                  value={settingsBankAccountNumber}
                  onChange={(e) => setSettingsBankAccountNumber(e.target.value)}
                  placeholder={t('settings_bank_account_no_ph')}
                  className={`w-full px-3 py-2.5 rounded-xl text-sm font-medium font-mono focus:outline-hidden transition-all ${roleTheme.inputClass}`}
                />
              </div>

              {/* Nama Pemegang Akaun */}
              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                  {t('settings_bank_holder_name')}
                </label>
                <input
                  type="text"
                  value={settingsBankAccountHolder}
                  onChange={(e) => setSettingsBankAccountHolder(e.target.value)}
                  placeholder={language === 'en' ? 'Enter account holder name' : 'Masukkan nama pemilik akaun'}
                  className={`w-full px-3 py-2.5 rounded-xl text-sm font-medium focus:outline-hidden transition-all ${roleTheme.inputClass}`}
                />
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SEKSYEN 5: TETAPAN MAKLUMAN & NOTIFIKASI */}
        {/* ======================================================== */}
        {(activeSection === 'all' || activeSection === 'notifications') && (
          <div className={`p-6 sm:p-7 rounded-2xl border space-y-5 transition-colors ${roleTheme.surfaceClass}`}>
            <div className={`flex items-center gap-2.5 pb-3 border-b ${roleTheme.dividerClass}`}>
              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold ${roleTheme.activeMiniBtnClass}`}>
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-extrabold text-black dark:text-white tracking-tight">{t('settings_notifications_title')}</h4>
              </div>
            </div>

            <div className={`divide-y ${roleTheme.dividerClass} rounded-2xl border ${roleTheme.surfaceMutedClass}`}>
              {/* WhatsApp Notification Toggle */}
              <div className="flex items-center justify-between p-4 transition-colors">
                <div className="flex items-start gap-3.5 pr-4">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-black dark:text-white">{t('settings_notify_wa_title')}</div>
                    <div className="text-[0.8125rem] text-black/70 dark:text-white/75 mt-0.5">
                      {t('settings_notify_wa_desc')}
                    </div>
                  </div>
                </div>
                <ToggleSwitch
                  checked={settingsNotifyWhatsApp}
                  onChange={setSettingsNotifyWhatsApp}
                  label="Notifikasi WhatsApp"
                />
              </div>

              {/* Email Notification Toggle */}
              <div className="flex items-center justify-between p-4 transition-colors">
                <div className="flex items-start gap-3.5 pr-4">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${roleTheme.activeMiniBtnClass}`}>
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-black dark:text-white">{t('settings_notify_email_title')}</div>
                    <div className="text-[0.8125rem] text-black/70 dark:text-white/75 mt-0.5">
                      {t('settings_notify_email_desc')}
                    </div>
                  </div>
                </div>
                <ToggleSwitch
                  checked={settingsNotifyEmail}
                  onChange={setSettingsNotifyEmail}
                  label="Notifikasi Emel"
                />
              </div>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* SEKSYEN 6: KESELAMATAN & TUKAR KATA LALUAN */}
        {/* ======================================================== */}
        {(activeSection === 'all' || activeSection === 'security') && (
          <div className={`p-6 sm:p-7 rounded-2xl border space-y-5 transition-colors ${roleTheme.surfaceClass}`}>
            <div className={`flex items-center gap-2.5 pb-3 border-b ${roleTheme.dividerClass}`}>
              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold ${roleTheme.activeMiniBtnClass}`}>
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-extrabold text-black dark:text-white tracking-tight">{t('settings_security_title')}</h4>
              </div>
            </div>

            {/* Password Feedback */}
            {passwordNotice && (
              <div className={`p-3.5 rounded-xl text-sm font-semibold flex items-center gap-2 ${
                passwordNotice.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-black dark:text-white border border-emerald-300 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-black dark:text-white border border-rose-300 dark:border-rose-800'
              }`}>
                {passwordNotice.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-700 dark:text-rose-400 shrink-0" />
                )}
                <span>{passwordNotice.text}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Kata Laluan Semasa / Lama */}
              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                  {t('settings_current_password_label')} <span className="text-black dark:text-white/75">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-black/60 dark:text-white/65 absolute left-3 top-3" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder={t('settings_current_password_ph')}
                    className={`w-full pl-9 pr-10 py-2.5 rounded-xl text-sm font-medium focus:outline-hidden transition-all ${roleTheme.inputClass}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-3 text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                    {t('settings_new_password_label')}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-black/60 dark:text-white/65 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={language === 'en' ? 'Enter new password' : 'Masukkan kata laluan baharu'}
                      className={`w-full pl-9 pr-10 py-2.5 rounded-xl text-sm font-medium focus:outline-hidden transition-all ${roleTheme.inputClass}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                    {t('settings_confirm_new_password_label')}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-black/60 dark:text-white/65 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={language === 'en' ? 'Re-enter new password' : 'Masukkan semula kata laluan baharu'}
                      className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-sm font-medium focus:outline-hidden transition-all ${roleTheme.inputClass}`}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleChangePasswordSubmit}
                disabled={isChangingPassword || !newPassword}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs ${roleTheme.primaryButtonClass}`}
              >
                {isChangingPassword ? (
                  <span>{t('settings_updating_password')}</span>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>{t('settings_update_password_btn')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SEKSYEN 8: TETAPAN PENTADBIR URUSETIA (ADMIN ONLY) */}
        {/* ======================================================== */}
        {isAdmin && (activeSection === 'all' || activeSection === 'admin') && (
          <div className={`text-black dark:text-white p-6 sm:p-7 rounded-2xl border space-y-6 ${roleTheme.surfaceClass}`}>
            <div className={`flex items-center gap-2.5 pb-3 border-b ${roleTheme.dividerClass}`}>
              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold ${roleTheme.activeMiniBtnClass}`}>
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-extrabold text-black dark:text-white tracking-tight">
                  {language === 'ms' ? 'Tetapan Parameter Pentadbir & Admin KBelia' : 'Secretariat & Admin Parameter Controls'}
                </h4>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pegawai Pentadbir */}
              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                  {language === 'ms' ? 'Nama Pegawai Pentadbir' : 'Administrator Name'}
                </label>
                <input
                  type="text"
                  value={adminOfficerName}
                  onChange={(e) => setAdminOfficerName(e.target.value)}
                  placeholder={language === 'ms' ? 'Masukkan nama pegawai pentadbir' : 'Enter administrator name'}
                  className={`w-full px-3 py-2 rounded-xl text-sm font-medium focus:outline-hidden transition-all ${roleTheme.inputClass}`}
                />
              </div>

              {/* Talian Meja Bantuan */}
              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                  {language === 'ms' ? 'Nombor Telefon Pentadbiran' : 'Administrator Phone Number'}
                </label>
                <input
                  type="text"
                  value={adminHelpdeskPhone}
                  onChange={(e) => setAdminHelpdeskPhone(e.target.value)}
                  placeholder={language === 'ms' ? 'Masukkan nombor telefon pentadbiran' : 'Enter administrator phone number'}
                  className={`w-full px-3 py-2 rounded-xl text-sm font-medium font-mono focus:outline-hidden transition-all ${roleTheme.inputClass}`}
                />
              </div>

              {/* Kadar Subsidi Sewaan Kiosk */}
              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                  {language === 'ms' ? 'Kadar Subsidi Sewaan' : 'Kiosk Rent Subsidy Rate'}
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={portalSubsidyRate}
                  onChange={(e) => setPortalSubsidyRate(e.target.value)}
                  placeholder={language === 'ms' ? 'Masukkan peratusan subsidi' : 'Enter subsidy percentage'}
                  className={`w-full px-3 py-2 rounded-xl text-sm font-medium focus:outline-hidden transition-all ${roleTheme.inputClass}`}
                />
              </div>

              {/* Had Tempoh Sewaan */}
              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                  {language === 'ms' ? 'Tempoh Maksimum Sewaan' : 'Maximum Lease Duration'}
                </label>
                <input
                  type="number"
                  min="1"
                  max="36"
                  value={maxLeaseDurationMonths}
                  onChange={(e) => setMaxLeaseDurationMonths(e.target.value)}
                  placeholder={language === 'ms' ? 'Masukkan tempoh dalam bulan' : 'Enter duration in months'}
                  className={`w-full px-3 py-2 rounded-xl text-sm font-medium focus:outline-hidden transition-all ${roleTheme.inputClass}`}
                />
              </div>

              {/* Pengumuman Portal */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                  {language === 'ms' ? 'Teks Pengumuman Portal' : 'Portal Announcement Text'}
                </label>
                <input
                  type="text"
                  value={portalAnnouncement}
                  onChange={(e) => setPortalAnnouncement(e.target.value)}
                  placeholder={language === 'ms' ? 'Masukkan teks pengumuman portal' : 'Enter portal announcement text'}
                  className={`w-full px-3 py-2 rounded-xl text-sm font-medium focus:outline-hidden transition-all ${roleTheme.inputClass}`}
                />
              </div>
            </div>

            {/* Seed Database button for admin */}
            <div className={`pt-3 border-t ${roleTheme.dividerClass} flex items-center justify-between`}>
              <span className="text-[0.8125rem] text-black/70 dark:text-white/75">
                {language === 'ms' ? 'Penyegerakan Pangkalan Data Awalan' : 'Initial Database Synchronization'}
              </span>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await seedInitialData();
                    setSettingsMessage({ 
                      type: 'success', 
                      text: language === 'ms' ? 'Pangkalan data berjaya disegerakkan semula!' : 'Initial data re-synchronized successfully!' 
                    });
                    onRefresh();
                  } catch (e) {
                    setSettingsMessage({ 
                      type: 'error', 
                      text: language === 'ms' ? 'Gagal menyegerakkan data.' : 'Failed to synchronize data.' 
                    });
                  }
                }}
                className={roleTheme.compactSecondaryButtonClass}
              >
                <Database className="w-3.5 h-3.5" />
                <span>{language === 'ms' ? 'Segerak Data' : 'Sync Data'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* BOTTOM SAVE BAR */}
        {/* ======================================================== */}
        <div className={`sticky bottom-4 z-30 p-4 rounded-2xl border shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors ${roleTheme.surfaceClass}`}>
          <div className="text-sm text-black dark:text-white text-center sm:text-left">
            {t('settings_bottom_notice')}
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="submit"
              disabled={savingSettings}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm sm:text-[0.9375rem] shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60 cursor-pointer ${roleTheme.primaryButtonClass}`}
            >
              {savingSettings ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t('settings_saving_progress')}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{t('settings_save_all_btn')}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </form>

    </div>
  );
};
