import React from 'react';
import { Store, Building2, Award, Heart, Shield, MapPin, Mail, Phone } from 'lucide-react';
import { ActiveTab } from './Navbar';

interface FooterProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  return (
    <footer className="bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          
          {/* Brand Col */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold">
                <Store className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">KBelia Kelantan</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Portal rasmi pembangunan inovasi, kapsul niaga & keusahawanan belia Kelantan (KBelia) dengan kerjasama Universiti Malaysia Kelantan (UMK) bagi memperkasa belia berniaga secara mampan dan berdaya saing.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-sky-700 dark:text-sky-400 font-semibold">
              <span>#KBelia</span>
              <span>•</span>
              <span>#BeliaKelantan</span>
              <span>•</span>
              <span>#UsahawanMudaKelantan</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Navigasi Utama</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => setActiveTab('home')} className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer">
                  Laman Utama
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('capsules')} className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer">
                  Sewa Kapsul Niaga (Kiosk)
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('directory')} className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer">
                  Direktori Usahawan Belia
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('programs')} className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer">
                  Geran & Bengkel Keusahawanan
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('merchant')} className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer">
                  Urus Bisnes Saya
                </button>
              </li>
            </ul>
          </div>

          {/* Hub Locations */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Lokasi Hab Kapsul</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <span>Pusat Belia KB Sentral, Kota Bharu</span>
              </li>
              <li className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <span>Hab Komuniti & Agrotek Jeli</span>
              </li>
              <li className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <span>Hab Niaga Belia Pantai Irama, Bachok</span>
              </li>
              <li className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <span>Hab Pelancongan & Kraf Pantai Sri Tujoh, Tumpat</span>
              </li>
            </ul>
          </div>

          {/* Support & Hub Contact */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Urusetia & Bantuan</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Sebarang pertanyaan mengenai permohonan kapsul atau pendaftaran peniaga belia:
            </p>
            <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>urusetia@kbelia.kelantan.gov.my</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>+60 9-748 1000 (Talian KBelia)</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-8 mt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} KBelia (Portal Pembangunan & Keusahawanan Belia Kelantan). Hak Cipta Terpelihara.</p>
          <div className="flex items-center gap-1">
            <span>Dibangunkan untuk Usahawan Belia Kelantan</span>
            <Heart className="w-3 h-3 text-sky-600 fill-sky-600 inline" />
            <span>dengan Google Firebase</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
