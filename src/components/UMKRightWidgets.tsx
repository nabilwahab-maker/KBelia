import React from 'react';
import { 
  Building2, 
  Store, 
  Award, 
  ArrowRight,
  Bell, 
  Headphones,
  Phone,
  Clock,
  ShieldCheck,
  MessageSquare,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { UMKTab } from './UMKHeader';
import { useAuth } from '../context/AuthContext';
import { CapsuleSlot, BusinessListing, YouthProgram } from '../types';

interface UMKRightWidgetsProps {
  setActiveTab: (tab: UMKTab) => void;
  onOpenBooking: () => void;
  slots?: CapsuleSlot[];
  businesses?: BusinessListing[];
  programs?: YouthProgram[];
}

export const UMKRightWidgets: React.FC<UMKRightWidgetsProps> = ({
  setActiveTab,
  onOpenBooking,
  slots = [],
}) => {
  const { user, userProfile, isAdmin } = useAuth();
  const availableCount = slots.filter(s => s && s.status === 'available').length;

  return (
    <div className="space-y-4 w-full min-w-0">
      
      {/* 1. STATUS SESI & PERANAN PENGGUNA */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-2xs transition-colors w-full min-w-0 overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-extrabold text-black dark:text-white">Sistem KBelia Aktif</span>
          </div>
          <span className="text-[10px] text-black dark:text-white font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900/50">
            Dalam Talian
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between text-black dark:text-white">
            <span>Peranan Sesi:</span>
            <span className="font-bold text-black dark:text-white">
              {user ? (isAdmin ? 'Pentadbir Urusetia' : 'Usahawan Belia') : 'Pelawat Awam'}
            </span>
          </div>
          {userProfile?.district && (
            <div className="flex items-center justify-between text-black dark:text-white">
              <span>Jajahan Asal:</span>
              <span className="font-semibold text-black dark:text-white">{userProfile.district}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-black dark:text-white">
            <span>Ketersediaan:</span>
            <span className="font-bold text-black dark:text-white/75">{availableCount} Kiosk Terbuka</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
          <button
            id="widget-apply-capsule-btn"
            onClick={onOpenBooking}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer dark:bg-blue-600"
          >
            <Building2 className="w-4 h-4 text-white" />
            <span>Mohon Kapsul Niaga</span>
          </button>
        </div>
      </div>

      {/* 2. PENGUMUMAN RASMI (ALERT BOX) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-2xs transition-colors w-full min-w-0 overflow-hidden">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-black dark:text-white">
            <Bell className="w-3.5 h-3.5 text-black dark:text-white/75" />
            <span>Pengumuman Rasmi</span>
          </div>
          <span className="text-[10px] text-black/70 dark:text-white/75 font-medium">Sesi 2026</span>
        </div>

        <div className="p-3.5 bg-blue-50 dark:bg-blue-950/60 rounded-xl border border-blue-200 dark:border-blue-800/70 text-left">
          <div className="text-xs font-bold text-black dark:text-white">Pengambilan Kiosk Modular</div>
          <p className="text-[11px] text-black dark:text-white mt-1 leading-relaxed">
            Permohonan dibuka untuk lokasi tumpuan Kota Bharu, Bachok, Kubang Kerian & Jeli.
          </p>
          <div 
            className="mt-2.5 flex items-center gap-1 text-[11px] font-bold text-black dark:text-white/75 cursor-pointer hover:underline" 
            onClick={onOpenBooking}
          >
            <span>Isi Borang Permohonan →</span>
          </div>
        </div>
      </div>

      {/* 3. KHIDMAT BANTUAN & WHATSAPP URUSETIA */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-2xs transition-colors w-full min-w-0 overflow-hidden">
        <div className="flex items-center gap-2 text-xs font-bold text-black dark:text-white mb-2">
          <Headphones className="w-4 h-4 text-black dark:text-white/75" />
          <span>Khidmat Bantuan Urusetia</span>
        </div>
        <p className="text-[11px] text-black dark:text-white leading-relaxed mb-3">
          Sebarang pertanyaan berkaitan sewaan kapsul, kelulusan borang atau geran bantuan:
        </p>

        <div className="space-y-2.5">
          <a
            href="https://wa.me/601155552026?text=Salam%20Urusetia%20KBelia,%20saya%20ingin%20bertanya%20berkaitan%20sewaan%20kiosk%20niaga"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-2xs"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Bantuan WhatsApp Rasmi</span>
          </a>

          <div className="pt-2.5 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] text-black dark:text-white">
            <span>Talian Pejabat:</span>
            <span className="font-bold text-black dark:text-white">09-771 2000</span>
          </div>
          <div className="text-[10px] text-black/70 dark:text-white/75 text-right">
            Ahad – Khamis (8.30 pg – 4.30 ptg)
          </div>
        </div>
      </div>

    </div>
  );
};
