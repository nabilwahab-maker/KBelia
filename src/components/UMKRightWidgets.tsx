import React from 'react';
import { 
  Bell, 
  Headphones,
  MessageSquare
} from 'lucide-react';
import { UMKTab } from './UMKHeader';
import { CapsuleSlot, BusinessListing, YouthProgram } from '../types';
import { useAuth } from '../context/AuthContext';
import { getDashboardRole, getRoleTheme } from '../utils/roleTheme';

interface UMKRightWidgetsProps {
  setActiveTab: (tab: UMKTab) => void;
  onOpenBooking: () => void;
  slots?: CapsuleSlot[];
  businesses?: BusinessListing[];
  programs?: YouthProgram[];
}

export const UMKRightWidgets: React.FC<UMKRightWidgetsProps> = ({
  onOpenBooking,
}) => {
  const { isAdmin, isMentor } = useAuth();
  const roleTheme = getRoleTheme(getDashboardRole(isAdmin, isMentor));
  return (
    <div className="space-y-4 w-full min-w-0">
      {/* 1. PENGUMUMAN RASMI (ALERT BOX) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 p-5 shadow-2xs transition-colors w-full min-w-0 overflow-hidden">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5 text-sm font-bold text-black dark:text-white">
            <Bell className="w-3.5 h-3.5 text-black dark:text-white/75" />
            <span>Pengumuman Rasmi</span>
          </div>
        </div>

        <div className={`p-3.5 rounded-xl border text-left ${roleTheme.surfaceMutedClass} ${roleTheme.dividerClass}`}>
          <div className="text-sm font-bold text-black dark:text-white">Pengambilan Kiosk Modular</div>
          <p className="text-[0.875rem] text-black dark:text-white mt-1 leading-relaxed">
            Permohonan dibuka untuk lokasi tumpuan Kota Bharu, Bachok, Kubang Kerian & Jeli.
          </p>
          <div 
            className="mt-2.5 flex items-center gap-1 text-[0.8125rem] font-bold text-black dark:text-white/75 cursor-pointer hover:underline" 
            onClick={onOpenBooking}
          >
            <span>Isi Borang Permohonan →</span>
          </div>
        </div>
      </div>

      {/* 3. KHIDMAT BANTUAN & WHATSAPP URUSETIA */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 p-5 shadow-2xs transition-colors w-full min-w-0 overflow-hidden">
        <div className="flex items-center gap-2 text-sm font-bold text-black dark:text-white mb-2">
          <Headphones className="w-4 h-4 text-black dark:text-white/75" />
          <span>Khidmat Bantuan KBelia</span>
        </div>
        <p className="text-[0.875rem] text-black dark:text-white leading-relaxed mb-3">
          Sebarang pertanyaan berkaitan sewaan kiosk, kelulusan borang atau bantuan geran:
        </p>

        <div className="space-y-2.5">
          <a
            href="https://wa.me/601155552026?text=Salam%20Admin%20KBelia,%20saya%20ingin%20bertanya%20berkaitan%20sewaan%20kiosk%20niaga"
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full py-2.5 px-3 text-sm inline-flex items-center justify-center gap-2 shadow-2xs ${roleTheme.primaryButtonClass}`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp Urusetia</span>
          </a>

          <div className="pt-2.5 border-t border-slate-300 dark:border-slate-600 flex items-center justify-between text-[0.8125rem] text-black dark:text-white">
            <span>Talian Pejabat:</span>
            <span className="font-bold text-black dark:text-white">09-771 2000</span>
          </div>
          <div className="text-[0.8125rem] text-black/70 dark:text-white/75 text-right">
            Ahad – Khamis (8.30 pg – 4.30 ptg)
          </div>
        </div>
      </div>

    </div>
  );
};
