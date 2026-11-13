import React, { useState } from 'react';
import { 
  Building2, 
  Store, 
  Award, 
  Shield, 
  Briefcase, 
  Compass, 
  X, 
  MapPin, 
  Sliders, 
  Sparkles, 
  Phone, 
  HelpCircle, 
  ArrowRight, 
  CheckCircle2, 
  LogIn, 
  LogOut,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { ActiveTab } from './Navbar';
import { useAuth } from '../context/AuthContext';
import { CapsuleSlot, BusinessListing, YouthProgram } from '../types';

interface SlideBarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenBooking?: () => void;
  slots: CapsuleSlot[];
  businesses: BusinessListing[];
  programs: YouthProgram[];
  selectedHubFilter?: string;
  onSelectHubFilter?: (hub: string) => void;
  maxBudget?: number;
  onBudgetChange?: (val: number) => void;
}

export const SlideBar: React.FC<SlideBarProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  onOpenBooking,
  slots = [],
  businesses = [],
  programs = [],
  selectedHubFilter = 'Semua',
  onSelectHubFilter,
  maxBudget = 500,
  onBudgetChange
}) => {
  const { user, isAdmin, logout, openLoginModal } = useAuth();
  const [localBudget, setLocalBudget] = useState(maxBudget);

  const safeSlots = slots || [];
  const safeBusinesses = businesses || [];
  const safePrograms = programs || [];

  const availableSlotsCount = safeSlots.filter((s) => s && s.status === 'available').length;
  const hubs = [
    { name: 'Semua', label: 'Semua Hub Kelantan' },
    { name: 'Hub UMK Bachok', label: 'UMK Bachok' },
    { name: 'Hub Belia Kota Bharu', label: 'Kota Bharu' },
    { name: 'Hub Komuniti Jeli', label: 'Jeli' },
    { name: 'Hub Kraf Tumpat', label: 'Tumpat' }
  ];

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    onClose();
  };

  const handleHubClick = (hub: string) => {
    if (onSelectHubFilter) {
      onSelectHubFilter(hub);
    }
    setActiveTab('capsules');
    onClose();
  };

  const handleBudgetSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setLocalBudget(val);
    if (onBudgetChange) {
      onBudgetChange(val);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          id="slidebar-backdrop"
          onClick={onClose}
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        />
      )}

      {/* Slide Bar Drawer */}
      <aside
        id="app-slidebar-drawer"
        className={`fixed top-0 left-0 bottom-0 z-50 w-80 sm:w-96 bg-white shadow-2xl flex flex-col border-r border-slate-200 transition-transform duration-300 ease-in-out transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Slide Bar Header (Important Header) */}
        <div className="p-5 kbelia-important-header text-slate-900 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white font-black shadow-sm">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-slate-900">KBelia</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                  KELANTAN
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Portal Pembangunan & Keusahawanan Belia</p>
            </div>
          </div>
          <button
            id="close-slidebar-btn"
            onClick={onClose}
            aria-label="Tutup Menu Sisi"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Quick Stats Badges */}
          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="text-center">
              <div className="text-xs font-bold text-emerald-700">{availableSlotsCount}</div>
              <div className="text-[10px] text-slate-500 font-medium leading-tight">Kapsul Kosong</div>
            </div>
            <div className="text-center border-x border-slate-200">
              <div className="text-xs font-bold text-amber-700">{businesses.length}</div>
              <div className="text-[10px] text-slate-500 font-medium leading-tight">Usahawan</div>
            </div>
            <div className="text-center">
              <div className="text-xs font-bold text-sky-700">{programs.length}</div>
              <div className="text-[10px] text-slate-500 font-medium leading-tight">Geran Aktif</div>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Navigasi Utama
            </div>
            <div className="space-y-1">
              <button
                id="slidebar-tab-home"
                onClick={() => handleNavClick('home')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'home'
                    ? 'bg-sky-600 text-white font-semibold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Compass className="w-4 h-4" />
                  <span>Halaman Utama</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-70" />
              </button>

              <button
                id="slidebar-tab-capsules"
                onClick={() => handleNavClick('capsules')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'capsules'
                    ? 'bg-sky-600 text-white font-semibold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4" />
                  <span>Kapsul Niaga (Kiosk)</span>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full">
                  {availableSlotsCount} kosong
                </span>
              </button>

              <button
                id="slidebar-tab-directory"
                onClick={() => handleNavClick('directory')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'directory'
                    ? 'bg-sky-600 text-white font-semibold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Store className="w-4 h-4" />
                  <span>Direktori Usahawan</span>
                </div>
                <span className="text-xs text-slate-400 font-semibold">{safeBusinesses.length}</span>
              </button>

              <button
                id="slidebar-tab-programs"
                onClick={() => handleNavClick('programs')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'programs'
                    ? 'bg-sky-600 text-white font-semibold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Award className="w-4 h-4" />
                  <span>Geran & Program Belia</span>
                </div>
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 rounded">
                  {safePrograms.length} Baru
                </span>
              </button>

              <button
                id="slidebar-tab-merchant"
                onClick={() => handleNavClick('merchant')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'merchant'
                    ? 'bg-sky-600 text-white font-semibold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Briefcase className="w-4 h-4" />
                  <span>Urus Bisnes Saya</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-70" />
              </button>

              {isAdmin && (
                <button
                  id="slidebar-tab-admin"
                  onClick={() => handleNavClick('admin')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    activeTab === 'admin'
                      ? 'bg-amber-500 text-slate-900 shadow-xs'
                      : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-amber-700" />
                    <span>Panel Pentadbir (Admin)</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 bg-amber-200 text-amber-900 rounded">
                    Admin
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Hub Filter Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Lokasi Hub Kapsul
              </span>
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {hubs.map((hub) => {
                const isSelected = selectedHubFilter === hub.name;
                return (
                  <button
                    key={hub.name}
                    id={`slidebar-hub-${hub.name.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => handleHubClick(hub.name)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all border ${
                      isSelected
                        ? 'bg-sky-50 text-sky-800 border-sky-200 font-bold'
                        : 'bg-slate-50 text-slate-700 hover:bg-sky-50/70 border-slate-200'
                    }`}
                  >
                    {hub.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Slide Bar: Budget Slider Filter */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-sky-600" />
                <span className="text-xs font-bold text-slate-800">Slide Bar Bajet Sewa</span>
              </div>
              <span className="text-xs font-extrabold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full">
                Maks RM {localBudget}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Tarik slider untuk tapis kapsul niaga mengikut bajet bulanan usahawan:
            </p>
            <input
              id="slidebar-budget-slider"
              type="range"
              min="100"
              max="500"
              step="20"
              value={localBudget}
              onChange={handleBudgetSlider}
              className="w-full accent-sky-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1">
              <span>RM 100/bln</span>
              <span>RM 300/bln</span>
              <span>RM 500/bln</span>
            </div>
          </div>

          {/* Quick CTA Card */}
          <div className="p-4 bg-white rounded-xl text-slate-800 border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-sky-700 mb-1">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>Peluang Niaga Belia</span>
            </div>
            <p className="text-xs font-medium text-slate-600 mb-3">
              Kapsul niaga mikro bermula serendah RM110 sebulan dengan elektrik & WiFi pantas.
            </p>
            {onOpenBooking && (
              <button
                id="slidebar-cta-book-btn"
                onClick={() => {
                  onOpenBooking();
                  onClose();
                }}
                className="w-full py-2 px-3 bg-sky-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-sky-500 transition-colors cursor-pointer"
              >
                <span>Tempah Slot Sekarang</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Slide Bar Footer: User / Auth */}
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          {user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src={user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`}
                  alt=""
                  className="w-9 h-9 rounded-full border border-sky-200 object-cover"
                />
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-800 truncate max-w-[130px]">
                    {user.displayName || 'Usahawan Belia'}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-medium">
                    {isAdmin ? 'Pentadbir' : 'Usahawan Berdaftar'}
                  </div>
                </div>
              </div>
              <button
                id="slidebar-logout-btn"
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Log Keluar"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                id="slidebar-login-standalone-btn"
                onClick={() => {
                  setActiveTab('login');
                  onClose();
                }}
                className="w-full py-2.5 px-4 bg-sky-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-sky-500 transition-colors shadow-sm cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-sky-100" />
                <span>Buka Laman Log Masuk Penuh</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
