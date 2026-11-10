import React, { useState } from 'react';
import { 
  Store, 
  Building2, 
  Users, 
  Award, 
  Shield, 
  LogIn, 
  LogOut, 
  Menu, 
  X, 
  Sparkles,
  UserCheck,
  Briefcase,
  Compass,
  Sliders
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type ActiveTab = 'home' | 'capsules' | 'directory' | 'programs' | 'merchant' | 'admin' | 'login';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenBooking?: () => void;
  onToggleSlideBar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeTab, 
  setActiveTab, 
  onOpenBooking,
  onToggleSlideBar 
}) => {
  const { user, userProfile, isAdmin, logout, loading, openLoginModal } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home' as ActiveTab, label: 'Utama', icon: Compass },
    { id: 'capsules' as ActiveTab, label: 'Kapsul Niaga (Kiosk)', icon: Building2 },
    { id: 'directory' as ActiveTab, label: 'Direktori Usahawan', icon: Store },
    { id: 'programs' as ActiveTab, label: 'Geran & Program', icon: Award },
    { id: 'merchant' as ActiveTab, label: 'Urus Bisnes Saya', icon: Briefcase, authOnly: true },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200/80 shadow-xs">
      {/* Top Notification / Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-amber-900 text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <span className="bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider">
              Inisiatif Belia Kelantan
            </span>
            <span className="hidden sm:inline">Pusat Inkubasi & Kapsul Niaga Mikro Usahawan Belia (Inspirasi UMK Capsule)</span>
          </div>
          <div className="flex items-center gap-3 text-emerald-200 text-[11px]">
            <span>Hub: UMK Bachok • KB Sentral • Jeli</span>
          </div>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            {/* Slide Bar Toggle Button */}
            {onToggleSlideBar && (
              <button
                id="nav-slidebar-toggle-btn"
                onClick={onToggleSlideBar}
                title="Buka Slide Bar / Menu Sisi"
                className="p-2 rounded-xl text-slate-700 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200 transition-all flex items-center gap-1.5 shadow-2xs"
              >
                <Sliders className="w-4 h-4 text-emerald-700" />
                <span className="hidden md:inline text-xs font-bold">Slide Bar</span>
              </button>
            )}

            {/* Brand Logo */}
            <button 
              id="nav-brand-btn"
              onClick={() => { setActiveTab('home'); setMobileMenuOpen(false); }}
              className="flex items-center gap-3 text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-amber-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg text-slate-900 tracking-tight">NiagaBelia</span>
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                    KELANTAN
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">Portal Kapsul Niaga & Direktori Belia</p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-xs border border-emerald-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-slate-500'}`} />
                  {item.label}
                </button>
              );
            })}

            {/* Admin Portal Tab */}
            {isAdmin && (
              <button
                id="nav-tab-admin"
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ml-1 ${
                  activeTab === 'admin'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300/80'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Panel Admin</span>
              </button>
            )}
          </nav>

          {/* Right Actions / Auth */}
          <div className="hidden sm:flex items-center gap-3">
            {loading ? (
              <div className="w-24 h-9 bg-slate-100 rounded-lg animate-pulse"></div>
            ) : user ? (
              <div className="flex items-center gap-3">
                <button
                  id="nav-merchant-btn"
                  onClick={() => setActiveTab('merchant')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shadow-xs"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Daftar / Urus Bisnes</span>
                </button>

                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <img
                    src={user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`}
                    alt="Profil"
                    className="w-8 h-8 rounded-full border border-emerald-300 object-cover"
                  />
                  <div className="hidden xl:block text-left">
                    <div className="text-xs font-semibold text-slate-900 truncate max-w-[120px] flex items-center gap-1">
                      <span>{user.displayName || 'Usahawan Belia'}</span>
                      {user.isDemo && (
                        <span className="px-1 py-0.2 text-[9px] bg-amber-100 text-amber-900 rounded font-bold">Demo</span>
                      )}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-medium">
                      {isAdmin ? 'Pentadbir (Admin)' : 'Belia Berdaftar'}
                    </div>
                  </div>
                  <button
                    id="nav-logout-btn"
                    onClick={logout}
                    title="Log Keluar"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                id="nav-login-modal-btn"
                onClick={openLoginModal}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-xs"
              >
                <LogIn className="w-4 h-4 text-amber-400" />
                <span>Log Masuk Belia</span>
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center gap-2">
            {onToggleSlideBar && (
              <button
                id="mobile-slidebar-toggle-btn"
                onClick={onToggleSlideBar}
                className="p-2 rounded-lg text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100"
                title="Buka Slide Bar"
              >
                <Sliders className="w-5 h-5" />
              </button>
            )}
            {!user && (
              <button
                onClick={openLoginModal}
                className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                Log Masuk
              </button>
            )}
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-slate-500'}`} />
                {item.label}
              </button>
            );
          })}

          {isAdmin && (
            <button
              onClick={() => {
                setActiveTab('admin');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold bg-amber-100 text-amber-900 border border-amber-300"
            >
              <Shield className="w-4 h-4 text-amber-800" />
              Panel Pentadbir (Admin)
            </button>
          )}

          {user && (
            <div className="pt-3 mt-3 border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`}
                  alt=""
                  className="w-8 h-8 rounded-full border border-emerald-300"
                />
                <div className="text-left">
                  <div className="text-xs font-semibold text-slate-900">{user.displayName}</div>
                  <div className="text-[11px] text-slate-500">{user.email}</div>
                </div>
              </div>
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="px-3 py-1.5 text-xs text-rose-600 font-semibold bg-rose-50 rounded-lg"
              >
                Log Keluar
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
