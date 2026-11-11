import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Home, 
  Briefcase, 
  Building2, 
  Menu,
  X,
  LogOut, 
  User, 
  ShieldCheck, 
  Store, 
  LogIn, 
  ChevronDown, 
  Clock,
  Settings,
  Bell,
  Sun,
  Moon,
  ChevronsLeft,
  ChevronsRight,
  GraduationCap,
  MoreVertical,
  Coins,
  Award,
  Network,
  Users,
  FileCheck,
  LayoutDashboard,
  Calendar,
  Sparkles,
  Search,
  ExternalLink,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { NotificationDropdown } from './NotificationDropdown';
import { CapsuleSlot, BusinessListing, YouthProgram } from '../types';

export type UMKTab = 
  | 'home' 
  | 'academic' 
  | 'hepa' 
  | 'ceed' 
  | 'events' 
  | 'b2b' 
  | 'calculator' 
  | 'admin' 
  | 'merchant' 
  | 'mentor' 
  | 'login' 
  | 'register' 
  | 'landing' 
  | 'settings';

interface UMKHeaderProps {
  activeTab: UMKTab;
  setActiveTab: (tab: UMKTab) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  onOpenBooking?: () => void;
  slots?: CapsuleSlot[];
  businesses?: BusinessListing[];
  programs?: YouthProgram[];
  onSelectSlot?: (slot: CapsuleSlot) => void;
  onSelectBusiness?: (biz: BusinessListing) => void;
  onOpenGrantModal?: (title?: string, amount?: string) => void;
}

export const UMKHeader: React.FC<UMKHeaderProps> = ({
  activeTab,
  setActiveTab,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  onOpenBooking,
  slots = [],
  businesses = [],
  programs = [],
  onSelectSlot,
  onSelectBusiness,
  onOpenGrantModal
}) => {
  const { user, userProfile, isAdmin, logout, loginAsDemoUser } = useAuth();
  const { theme, isDark, toggleTheme, setTheme } = useTheme();
  const { t, language } = useLanguage();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const themeDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(e.target as Node)) {
        setThemeDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 60);
    }
  }, [isSearchOpen]);

  const searchResults = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    if (!q) return null;

    const matchedSlots = (slots || []).filter(s =>
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.code && s.code.toLowerCase().includes(q)) ||
      (s.district && s.district.toLowerCase().includes(q)) ||
      (s.hubLocation && s.hubLocation.toLowerCase().includes(q))
    ).slice(0, 3);

    const matchedBiz = (businesses || []).filter(b =>
      (b.name && b.name.toLowerCase().includes(q)) ||
      (b.category && b.category.toLowerCase().includes(q)) ||
      (b.district && b.district.toLowerCase().includes(q))
    ).slice(0, 3);

    const matchedProg = (programs || []).filter(p =>
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q))
    ).slice(0, 3);

    const totalCount = matchedSlots.length + matchedBiz.length + matchedProg.length;
    return { matchedSlots, matchedBiz, matchedProg, totalCount };
  }, [globalSearch, slots, businesses, programs]);

  const displayName = userProfile?.fullName || user?.displayName || (isAdmin ? 'Pentadbir Sistem' : 'Usahawan Belia');
  const avatarSrc = userProfile?.avatarUrl || user?.photoURL || (isAdmin 
    ? '/public/assets/generated/avatar_admin_kelantan_1793924251898.jpg' 
    : userProfile?.role === 'mentor' 
      ? '/public/assets/generated/avatar_mentor_umk_1793924250411.jpg' 
      : '/public/assets/generated/avatar_youth_male_1793924250192.jpg');

  return (
    <header className="bg-white dark:bg-[#1C2434] border-b border-slate-200 dark:border-[#2E3A47] sticky top-0 z-40 transition-colors duration-200 shadow-2xs w-full shrink-0">
      {/* Top Main Navigation Row */}
      <div className="w-full flex items-stretch h-15 sm:h-16">
        
        {/* Left Column: Exactly Aligned with Sidebar below (w-64 or w-18) */}
        <div className={`${isSidebarCollapsed ? 'w-18 px-2 justify-center gap-1' : 'w-64 px-4 justify-between'} shrink-0 h-full border-r border-slate-200 dark:border-[#2E3A47] flex items-center transition-all duration-200 bg-white dark:bg-[#1C2434]`}>
          
          {/* KBELIA Brand Wordmark */}
          <button
            id="kbelia-logo-btn"
            onClick={() => setShowLogoutConfirm(true)}
            className={`flex items-center gap-2.5 hover:opacity-95 transition-opacity text-left shrink-0 cursor-pointer ${isSidebarCollapsed ? 'justify-center' : ''}`}
            title="KBELIA - Tekan logo untuk log keluar"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs shrink-0">
              <span className="font-extrabold text-white">KB</span>
            </div>

            {!isSidebarCollapsed && (
              <div className="leading-tight">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                    KBELIA
                  </span>
                  <span className="text-xs text-slate-300 dark:text-slate-600 font-normal">·</span>
                  <span className="text-xs font-semibold text-blue-800 dark:text-blue-400">
                    UMK CEED
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                  {isAdmin ? 'Panel Pentadbir' : userProfile?.role === 'mentor' ? 'Portal Mentor Pakar' : 'Portal Usahawan Belia'}
                </p>
              </div>
            )}
          </button>

          {/* Toggle Sidebar Collapse Button (<< or >>) placed at right of brand box matching reference image */}
          <button
            id="toggle-sidebar-collapse-btn"
            onClick={() => setIsSidebarCollapsed(prev => !prev)}
            title={isSidebarCollapsed ? t('nav_expand_sidebar') : t('nav_collapse_sidebar')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-[#2E3A47] transition-all cursor-pointer interactive-press active:scale-90"
          >
            {isSidebarCollapsed ? (
              <ChevronsRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            ) : (
              <ChevronsLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
            )}
          </button>
        </div>

        {/* Right Section: Navigation Links & Action Controls */}
        <div className="flex-1 min-w-0 px-3 sm:px-4 lg:px-6 flex items-center justify-between h-full gap-3 lg:gap-4">
          
          {/* Left Spacer so controls sit gracefully on the right */}
          <div className="flex-1" />

        {/* Right Section: Search Popover + Theme Selector Dropdown + Notifications + User Menu */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          
          {/* Global Search Button & Popover (Only shows icon; opens input & results underneath on click) */}
          <div ref={searchContainerRef} className="relative">
            <button
              type="button"
              onClick={() => setIsSearchOpen(prev => !prev)}
              className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border transition-all duration-200 cursor-pointer shadow-2xs group focus:outline-none interactive-press hover:scale-105 active:scale-95 ${
                isSearchOpen
                  ? 'bg-red-50 text-red-700 border-red-300 dark:bg-[#2E3A47] dark:text-amber-400 dark:border-amber-500/50'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#1A222C] dark:hover:bg-[#2E3A47] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-[#2E3A47]'
              }`}
              title="Carian Sistem"
              aria-label="Buka carian"
            >
              <Search className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
            </button>

            {/* Dropdown Popover below Search Icon */}
            {isSearchOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#24303F] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#2E3A47] p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="relative flex items-center mb-2">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder={t('search_global_ph') || 'Cari kiosk, usahawan, geran...'}
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 text-xs bg-slate-100 dark:bg-[#1A222C] border border-slate-200 dark:border-[#2E3A47] rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-red-700 dark:focus:ring-amber-500 shadow-2xs"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  {globalSearch && (
                    <button
                      type="button"
                      onClick={() => setGlobalSearch('')}
                      className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Instant Autocomplete Results */}
                {searchResults ? (
                  <div className="max-h-[60vh] overflow-y-auto space-y-3 pt-1">
                    {searchResults.totalCount === 0 ? (
                      <div className="py-5 px-3 text-center">
                        <Search className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto mb-1.5" />
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {t('search_no_results')} "{globalSearch}"
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Kiosks results */}
                        {searchResults.matchedSlots.length > 0 && (
                          <div>
                            <div className="text-[10px] font-extrabold uppercase tracking-wider text-red-700 dark:text-amber-400 px-2 mb-1 flex items-center gap-1.5">
                              <Building2 className="w-3 h-3" />
                              <span>{t('search_results_kiosks')}</span>
                            </div>
                            <div className="space-y-0.5">
                              {searchResults.matchedSlots.map(slot => (
                                <button
                                  key={slot.id}
                                  type="button"
                                  onClick={() => {
                                    if (onSelectSlot) onSelectSlot(slot);
                                    else setActiveTab('hepa');
                                    setIsSearchOpen(false);
                                    setGlobalSearch('');
                                  }}
                                  className="w-full p-2 text-left rounded-xl hover:bg-slate-100 dark:hover:bg-[#1A222C] flex items-center justify-between transition-colors cursor-pointer"
                                >
                                  <div>
                                    <span className="font-bold text-xs text-slate-900 dark:text-white block">
                                      {slot.name} ({slot.code})
                                    </span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                      {slot.district} · RM{slot.monthlyRate}/bln
                                    </span>
                                  </div>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    slot.status === 'available'
                                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                  }`}>
                                    {slot.status === 'available' ? t('slot_status_available') : t('slot_status_occupied')}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Merchants results */}
                        {searchResults.matchedBiz.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 px-2 mb-1 flex items-center gap-1.5">
                              <Store className="w-3 h-3" />
                              <span>{t('search_results_merchants')}</span>
                            </div>
                            <div className="space-y-0.5">
                              {searchResults.matchedBiz.map(biz => (
                                <button
                                  key={biz.id}
                                  type="button"
                                  onClick={() => {
                                    if (onSelectBusiness) onSelectBusiness(biz);
                                    else setActiveTab('hepa');
                                    setIsSearchOpen(false);
                                    setGlobalSearch('');
                                  }}
                                  className="w-full p-2 text-left rounded-xl hover:bg-slate-100 dark:hover:bg-[#1A222C] flex items-center justify-between transition-colors cursor-pointer"
                                >
                                  <div>
                                    <span className="font-bold text-xs text-slate-900 dark:text-white block">
                                      {biz.name}
                                    </span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                      {biz.category} · {biz.district}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                                    SSM ✓
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Programs results */}
                        {searchResults.matchedProg.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400 px-2 mb-1 flex items-center gap-1.5">
                              <Award className="w-3 h-3" />
                              <span>{t('search_results_grants')}</span>
                            </div>
                            <div className="space-y-0.5">
                              {searchResults.matchedProg.map(prog => (
                                <button
                                  key={prog.id}
                                  type="button"
                                  onClick={() => {
                                    if (onOpenGrantModal) onOpenGrantModal(prog.title, prog.grantAmount);
                                    else setActiveTab('ceed');
                                    setIsSearchOpen(false);
                                    setGlobalSearch('');
                                  }}
                                  className="w-full p-2 text-left rounded-xl hover:bg-slate-100 dark:hover:bg-[#1A222C] flex items-center justify-between transition-colors cursor-pointer"
                                >
                                  <div>
                                    <span className="font-bold text-xs text-slate-900 dark:text-white block">
                                      {prog.title}
                                    </span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                      {prog.category} · {prog.grantAmount}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                                    Bantuan
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="py-2.5 px-2 text-[11px] text-slate-500 dark:text-slate-400">
                    Taip nama kiosk, produk usahawan, atau geran untuk carian pantas.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Theme Mode Selector Dropdown (Mod Cerah / Mod Malam) */}
          <div ref={themeDropdownRef} className="relative">
            <button
              id="kbelia-darkmode-toggle"
              type="button"
              onClick={() => setThemeDropdownOpen(prev => !prev)}
              className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border transition-all duration-200 cursor-pointer shadow-2xs group focus:outline-none interactive-press hover:scale-105 active:scale-95 ${
                themeDropdownOpen
                  ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-[#2E3A47] dark:text-amber-300 dark:border-amber-500/50'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#1A222C] dark:hover:bg-[#2E3A47] text-slate-700 dark:text-amber-400 border-slate-200 dark:border-[#2E3A47]'
              }`}
              title="Pilih Mod Tema (Cerah / Malam)"
              aria-label="Pilih mod tema"
            >
              {isDark ? (
                <Moon className="w-4 h-4 text-amber-400 transition-transform duration-300 group-hover:rotate-12" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500 transition-transform duration-300 group-hover:rotate-45" />
              )}
            </button>

            {/* Dropdown Menu below Theme Button */}
            {themeDropdownOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-[#24303F] rounded-2xl shadow-xl border border-slate-200 dark:border-[#2E3A47] p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider px-2.5 py-1 mb-1">
                  Pilihan Tema
                </div>

                {/* Mod Cerah Option */}
                <button
                  type="button"
                  onClick={() => {
                    setTheme('light');
                    setThemeDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                    !isDark 
                      ? 'bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 font-bold' 
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1C2434]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>Mod Cerah</span>
                  </div>
                  {!isDark && <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
                </button>

                {/* Mod Malam Option */}
                <button
                  type="button"
                  onClick={() => {
                    setTheme('dark');
                    setThemeDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                    isDark 
                      ? 'bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 font-bold' 
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1C2434]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4 text-amber-400" />
                    <span>Mod Malam</span>
                  </div>
                  {isDark && <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
                </button>
              </div>
            )}
          </div>

          {/* Notification Bell Dropdown */}
          <NotificationDropdown onNavigateTab={(tab) => setActiveTab(tab as UMKTab)} />

          {/* Small Screen 3-Dots Overflow Menu (Design Rule: Have a plan for small screens) */}
            <div className="relative md:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  mobileMenuOpen 
                    ? 'bg-red-50 text-red-700 border-red-300 dark:bg-[#2E3A47] dark:text-amber-400 dark:border-amber-500/50' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-[#2E3A47] border-slate-200 dark:border-[#2E3A47]'
                }`}
                title="Pilihan Navigasi Lanjut (3-Dots)"
                aria-label="Menu navigasi skrin kecil"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {mobileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#24303F] rounded-2xl shadow-xl border border-slate-200 dark:border-[#2E3A47] p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider px-2.5 py-1 mb-1">
                    {t('nav_quick_nav')}
                  </div>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => { setActiveTab('home'); setMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                        activeTab === 'home' 
                          ? 'bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-300' 
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1C2434]'
                      }`}
                    >
                      <Home className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <span>{t('nav_portal_main')}</span>
                    </button>

                    {/* A. ADMIN MOBILE MENU */}
                    {isAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={() => { setActiveTab('admin'); setMobileMenuOpen(false); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                            activeTab === 'admin' 
                              ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300' 
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1C2434]'
                          }`}
                        >
                          <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span>{t('nav_admin_control')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => { setActiveTab('academic'); setMobileMenuOpen(false); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                            activeTab === 'academic' 
                              ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300' 
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1C2434]'
                          }`}
                        >
                          <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span>{t('nav_kiosk_approval')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => { setActiveTab('ceed'); setMobileMenuOpen(false); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                            activeTab === 'ceed' 
                              ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300' 
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1C2434]'
                          }`}
                        >
                          <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span>{t('nav_grant_approval')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => { setActiveTab('b2b'); setMobileMenuOpen(false); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                            activeTab === 'b2b' 
                              ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300' 
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1C2434]'
                          }`}
                        >
                          <Network className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span>{t('nav_district_analytics')}</span>
                        </button>
                      </>
                    )}

                    {/* B. MENTOR MOBILE MENU */}
                    {!isAdmin && userProfile?.role === 'mentor' && (
                      <>
                        <button
                          type="button"
                          onClick={() => { setActiveTab('mentor'); setMobileMenuOpen(false); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                            activeTab === 'mentor' 
                              ? 'bg-purple-100 text-purple-900 dark:bg-purple-950/60 dark:text-purple-300' 
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1C2434]'
                          }`}
                        >
                          <GraduationCap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <span>{t('nav_mentor_main_hub')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => { setActiveTab('events'); setMobileMenuOpen(false); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                            activeTab === 'events' 
                              ? 'bg-purple-100 text-purple-900 dark:bg-purple-950/60 dark:text-purple-300' 
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1C2434]'
                          }`}
                        >
                          <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <span>{t('nav_clinic_schedule')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => { setActiveTab('hepa'); setMobileMenuOpen(false); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                            activeTab === 'hepa' 
                              ? 'bg-purple-100 text-purple-900 dark:bg-purple-950/60 dark:text-purple-300' 
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1C2434]'
                          }`}
                        >
                          <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <span>{t('nav_entrepreneurs')}</span>
                        </button>
                      </>
                    )}

                    {/* C. YOUTH ENTREPRENEUR MOBILE MENU */}
                    {!isAdmin && userProfile?.role !== 'mentor' && (
                      <>
                        <button
                          type="button"
                          onClick={() => { setActiveTab('merchant'); setMobileMenuOpen(false); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                            activeTab === 'merchant' || activeTab === 'home'
                              ? 'bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-300' 
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1C2434]'
                          }`}
                        >
                          <LayoutDashboard className="w-4 h-4 text-red-600 dark:text-red-400" />
                          <span>{t('dashboard')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => { setActiveTab('academic'); setMobileMenuOpen(false); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                            activeTab === 'academic' 
                              ? 'bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-300' 
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1C2434]'
                          }`}
                        >
                          <Building2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                          <span>{t('nav_my_kiosk')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => { setActiveTab('b2b'); setMobileMenuOpen(false); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                            activeTab === 'b2b' 
                              ? 'bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-300' 
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1C2434]'
                          }`}
                        >
                          <Coins className="w-4 h-4 text-red-600 dark:text-red-400" />
                          <span>{t('nav_sales_pos')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => { setActiveTab('ceed'); setMobileMenuOpen(false); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                            activeTab === 'ceed' 
                              ? 'bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-300' 
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1C2434]'
                          }`}
                        >
                          <Award className="w-4 h-4 text-red-600 dark:text-red-400" />
                          <span>{t('grants')}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Dropdown */}
            {user ? (
              <div ref={profileDropdownRef} className="relative">
              <button
                id="kbelia-user-profile-btn"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 pl-3 sm:pl-4 pr-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#2E3A47] transition-all border border-slate-200 dark:border-[#2E3A47] hover:border-amber-400/50 cursor-pointer shadow-2xs group interactive-press interactive-lift"
                title={`${displayName} - ${isAdmin ? 'Pentadbiran' : userProfile?.role === 'mentor' ? 'Mentor' : 'Usahawan'}`}
              >
                {/* Profile Text on Left: Full name & full "Pentadbiran" text */}
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight whitespace-nowrap group-hover:text-amber-800 dark:group-hover:text-amber-300 transition-colors">
                    {displayName}
                  </div>
                  <div className="text-[10.5px] font-bold text-amber-700 dark:text-amber-400 whitespace-nowrap">
                    {isAdmin ? 'Pentadbiran' : userProfile?.role === 'mentor' ? t('role_mentor') : t('role_youth')}
                  </div>
                </div>

                {/* Avatar Image on Right inside the box */}
                <img
                  src={avatarSrc}
                  alt={displayName}
                  referrerPolicy="no-referrer"
                  className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-lg object-cover border border-amber-300 dark:border-amber-600 shadow-2xs shrink-0 transition-transform duration-200 group-hover:scale-108 group-hover:ring-2 group-hover:ring-amber-400/40"
                />

                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-transform duration-200 group-hover:translate-y-0.5 shrink-0" />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#24303F] rounded-2xl shadow-xl border border-slate-200 dark:border-[#2E3A47] p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="p-2.5 bg-slate-50 dark:bg-[#1C2434] rounded-xl mb-2 border border-slate-100 dark:border-[#2E3A47]">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{displayName}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</div>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                      <Clock className="w-3 h-3" />
                      <span>{t('active_session')}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <button
                      id="kbelia-dropdown-setting-btn"
                      onClick={() => { setActiveTab('settings'); setProfileDropdownOpen(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold rounded-xl text-left transition-colors cursor-pointer ${
                        activeTab === 'settings'
                          ? 'bg-red-50 text-red-700 dark:bg-[#1C2434] dark:text-red-400 font-bold border border-red-200 dark:border-red-900/60'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1C2434]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Settings className={`w-4 h-4 ${activeTab === 'settings' ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`} />
                        <span>{language === 'en' ? 'Account Settings' : 'Tetapan Akaun'}</span>
                      </div>
                      {activeTab === 'settings' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-400" />
                      )}
                    </button>

                    {/* QUICK ROLE SWITCHER FOR TESTING */}
                    <div className="pt-2 border-t border-slate-100 dark:border-[#2E3A47] mt-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>{t('quick_role_switch')}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 px-1">
                        <button
                          type="button"
                          onClick={() => {
                            loginAsDemoUser('merchant_faizul');
                            setActiveTab('merchant');
                            setProfileDropdownOpen(false);
                          }}
                          className={`px-1.5 py-1 rounded text-[10px] font-bold text-center transition-colors ${
                            !isAdmin && userProfile?.role !== 'mentor'
                              ? 'bg-red-700 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {t('role_youth')}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            loginAsDemoUser('mentor_wanazhar');
                            setActiveTab('mentor');
                            setProfileDropdownOpen(false);
                          }}
                          className={`px-1.5 py-1 rounded text-[10px] font-bold text-center transition-colors ${
                            userProfile?.role === 'mentor'
                              ? 'bg-purple-700 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {t('role_mentor')}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            loginAsDemoUser('admin');
                            setActiveTab('admin');
                            setProfileDropdownOpen(false);
                          }}
                          className={`px-1.5 py-1 rounded text-[10px] font-bold text-center transition-colors ${
                            isAdmin
                              ? 'bg-amber-500 text-slate-950 font-black'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {t('role_admin')}
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-[#2E3A47] mt-1.5 space-y-1">
                      <button
                        id="kbelia-dropdown-logout-btn"
                        onClick={async () => {
                          setProfileDropdownOpen(false);
                          await logout();
                          setActiveTab('login');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl text-left transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>{t('logout')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              id="kbelia-header-login-btn"
              onClick={() => setActiveTab('login')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-2xs transition-colors"
            >
              <LogIn className="w-4 h-4 text-amber-300" />
              <span>{t('login')}</span>
            </button>
          )}

        </div>

      </div>
    </div>

    {/* Confirmation Modal: Adakah anda ingin log keluar? */}
    {showLogoutConfirm && (
      <div 
        id="kbelia-logout-confirm-modal"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      >
        <div 
          className="fixed inset-0" 
          onClick={() => setShowLogoutConfirm(false)}
        />
        <div className="relative bg-white dark:bg-[#1E293B] rounded-3xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-4 z-10">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 mx-auto flex items-center justify-center">
            <LogOut className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {t('logout_confirm_title')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {t('logout_confirm_desc')}
            </p>
          </div>
          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              id="btn-logout-confirm-no"
              onClick={() => setShowLogoutConfirm(false)}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              id="btn-logout-confirm-yes"
              onClick={async () => {
                await logout();
                setShowLogoutConfirm(false);
                setActiveTab('login');
              }}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-red-700 hover:bg-red-800 shadow-xs transition-colors cursor-pointer"
            >
              {t('confirm_logout')}
            </button>
          </div>
        </div>
      </div>
    )}
  </header>
  );
};
