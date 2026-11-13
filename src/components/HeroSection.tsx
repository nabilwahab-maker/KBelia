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
    <div className="kbelia-important-header text-slate-900 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column - Headline, Copy & CTA */}
          <div className="lg:col-span-7 space-y-6">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Platform Usahawan Belia Kelantan: Kapsul Niaga & Direktori Komersil
            </h1>

            <p className="text-slate-600 text-base sm:text-lg max-w-2xl leading-relaxed">
              Diilhamkan daripada inisiatif keusahawanan UMK, kami menyediakan ruang kiosk mikro berkos rendah, sokongan utiliti digital, geran perniagaan, dan pasaran terbuka untuk belia Kelantan berniaga secara teratur dan mampan.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                id="hero-book-slot-btn"
                type="button"
                onClick={() => setActiveTab('capsules')}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-[0.99] text-white font-bold text-sm transition-colors shadow-xs cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-sky-100" />
                <span>Sewa Kapsul Niaga (Kiosk)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="hero-explore-dir-btn"
                type="button"
                onClick={() => setActiveTab('directory')}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-50 active:scale-[0.99] text-slate-800 font-semibold text-sm border border-slate-200 transition-colors cursor-pointer"
              >
                <Store className="w-4 h-4 text-sky-600" />
                <span>Terokai Usahawan</span>
              </button>
            </div>

            {/* Trust Points */}
            <div className="pt-2 flex flex-wrap items-center gap-5 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-sky-600" />
                <span>Kemudahan Wi-Fi & Bekalan Elektrik</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-sky-600" />
                <span>Kadar Subsidi Belia (Dari RM110/bulan)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-sky-600" />
                <span>Bimbingan Pendaftaran SSM</span>
              </div>
            </div>
          </div>

          {/* Right Column - Capsule Showcase Card (Crisp White) */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              
              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900">Status Hab Kapsul Niaga</div>
                    <div className="text-[11px] text-slate-500">Liputan Bachok, Kota Bharu, Jeli</div>
                  </div>
                </div>
                <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {availableSlots} Slot Kosong
                </span>
              </div>

              {/* Stats Counters */}
              <div className="grid grid-cols-3 gap-3 my-5">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div className="text-xl font-extrabold text-emerald-700 font-mono">{availableSlots}</div>
                  <div className="text-[10px] text-slate-500 font-medium">Slot Tersedia</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div className="text-xl font-extrabold text-slate-800 font-mono">{totalBusinesses}</div>
                  <div className="text-[10px] text-slate-500 font-medium">Usahawan Aktif</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div className="text-xl font-extrabold text-slate-800 font-mono">10</div>
                  <div className="text-[10px] text-slate-500 font-medium">Jajahan Kelantan</div>
                </div>
              </div>

              {/* Information box */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-sky-600" />
                  <span>Kelebihan Ruang Kapsul:</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Unit kiosk siap guna dengan sistem keselamatan, sokongan transaksi tanpa tunai DuitNow QR, dan promosi digital terus kepada komuniti.
                </p>
              </div>

              {/* Quick Action Button */}
              <button
                id="hero-quick-apply-btn"
                type="button"
                onClick={() => setActiveTab('capsules')}
                className="mt-4 w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
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
