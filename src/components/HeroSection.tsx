import React from 'react';
import { 
  Building2, 
  Store, 
  MapPin, 
  ArrowRight, 
  TrendingUp, 
  CheckCircle2
} from 'lucide-react';
import { ActiveTab } from './Navbar';

interface HeroSectionProps {
  setActiveTab: (tab: ActiveTab) => void;
  onOpenBooking: () => void;
  totalSlots: number;
  availableSlots: number;
  totalBusinesses: number;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  setActiveTab,
  onOpenBooking,
  totalSlots,
  availableSlots,
  totalBusinesses
}) => {
  return (
    <div className="bg-slate-900 text-white border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column - Headline, Copy & CTA */}
          <div className="lg:col-span-7 space-y-6">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Platform Usahawan Belia Kelantan: Kapsul Niaga & Direktori Komersil
            </h1>

            <p className="text-slate-300 text-base sm:text-lg max-w-2xl leading-relaxed">
              Diilhamkan daripada inisiatif keusahawanan UMK, kami menyediakan ruang kiosk mikro berkos rendah, sokongan utiliti digital, geran perniagaan, dan pasaran terbuka untuk belia Kelantan berniaga secara teratur dan mampan.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                id="hero-book-slot-btn"
                type="button"
                onClick={() => setActiveTab('capsules')}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-700 hover:bg-red-800 active:scale-[0.99] text-white font-bold text-sm transition-colors"
              >
                <Building2 className="w-4 h-4 text-amber-300" />
                <span>Sewa Kapsul Niaga (Kiosk)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="hero-explore-dir-btn"
                type="button"
                onClick={() => setActiveTab('directory')}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-[0.99] text-white font-semibold text-sm border border-slate-700 transition-colors"
              >
                <Store className="w-4 h-4 text-slate-300" />
                <span>Terokai Usahawan</span>
              </button>
            </div>

            {/* Trust Points */}
            <div className="pt-2 flex flex-wrap items-center gap-5 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Kemudahan Wi-Fi & Bekalan Elektrik</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Kadar Subsidi Belia (Dari RM110/bulan)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Bimbingan Pendaftaran SSM</span>
              </div>
            </div>
          </div>

          {/* Right Column - Capsule Showcase Card */}
          <div className="lg:col-span-5">
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
              
              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-700">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-slate-700 text-slate-200 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white">Status Hab Kapsul Niaga</div>
                    <div className="text-[11px] text-slate-400">Liputan Bachok, Kota Bharu, Jeli</div>
                  </div>
                </div>
                <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                  {availableSlots} Slot Kosong
                </span>
              </div>

              {/* Stats Counters */}
              <div className="grid grid-cols-3 gap-3 my-5">
                <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-700/60 text-center">
                  <div className="text-xl font-extrabold text-amber-400 font-mono">{availableSlots}</div>
                  <div className="text-[10px] text-slate-400 font-medium">Slot Tersedia</div>
                </div>
                <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-700/60 text-center">
                  <div className="text-xl font-extrabold text-white font-mono">{totalBusinesses}</div>
                  <div className="text-[10px] text-slate-400 font-medium">Usahawan Aktif</div>
                </div>
                <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-700/60 text-center">
                  <div className="text-xl font-extrabold text-slate-200 font-mono">10</div>
                  <div className="text-[10px] text-slate-400 font-medium">Jajahan Kelantan</div>
                </div>
              </div>

              {/* Information box */}
              <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-700 space-y-1.5 text-xs">
                <div className="font-bold text-slate-200 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span>Kelebihan Ruang Kapsul:</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Unit kiosk siap guna dengan sistem keselamatan, sokongan transaksi tanpa tunai DuitNow QR, dan promosi digital terus kepada komuniti.
                </p>
              </div>

              {/* Quick Action Button */}
              <button
                id="hero-quick-apply-btn"
                type="button"
                onClick={() => setActiveTab('capsules')}
                className="mt-4 w-full py-2.5 px-4 bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <span>Lihat Senarai Kapsul & Hantar Permohonan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
