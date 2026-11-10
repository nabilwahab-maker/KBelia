import React, { useState } from 'react';
import { 
  Award, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Sparkles, 
  Building2, 
  CreditCard,
  Send,
  HelpCircle,
  FileCheck2,
  FileText
} from 'lucide-react';
import { BusinessCategory, GrantApplication } from '../types';
import { useAuth } from '../context/AuthContext';
import { createGrantApplication } from '../services/dataService';
import confetti from 'canvas-confetti';
import { Accordion } from './Accordion';
import { showToast } from './ToastNotification';

interface GrantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (grant: GrantApplication) => void;
  initialProgramTitle?: string;
  initialGrantAmount?: string;
}

const CATEGORIES: BusinessCategory[] = [
  'Makanan & Minuman (F&B)',
  'Fesyen, Batik & Kraf Kelantan',
  'Teknologi & Servis Digital',
  'Kecantikan & Kesihatan',
  'Pertanian & Agrotek',
  'Runcit & Gaya Hidup'
];

export const GrantModal: React.FC<GrantModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialProgramTitle = 'Dana Benih Usahawan Belia Kelantan (RM3,000)',
  initialGrantAmount = 'RM3,000'
}) => {
  const { user, userProfile, openLoginModal } = useAuth();

  const [programTitle, setProgramTitle] = useState(initialProgramTitle);
  const [grantAmount, setGrantAmount] = useState(initialGrantAmount);
  const [businessName, setBusinessName] = useState(userProfile?.businessName || '');
  const [businessCategory, setBusinessCategory] = useState<BusinessCategory>(userProfile?.category || 'Makanan & Minuman (F&B)');
  const [district, setDistrict] = useState('Kota Bharu');
  const [fundPurpose, setFundPurpose] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Sync if props change
  React.useEffect(() => {
    if (initialProgramTitle) setProgramTitle(initialProgramTitle);
    if (initialGrantAmount) setGrantAmount(initialGrantAmount);
    if (userProfile?.businessName && !businessName) setBusinessName(userProfile.businessName);
  }, [initialProgramTitle, initialGrantAmount, userProfile]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Sila log masuk terlebih dahulu untuk menghantar permohonan geran.');
      return;
    }

    const errors: Record<string, string> = {};

    if (!businessName.trim()) {
      errors.businessName = 'Sila masukkan nama perniagaan atau jenama anda.';
    }

    if (!fundPurpose.trim()) {
      errors.fundPurpose = 'Sila nyatakan secara ringkas tujuan penggunaan dana.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Sila lengkapkan maklumat bertanda merah di bawah.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setFieldErrors({});

      const grantData = await createGrantApplication({
        programTitle,
        grantAmount,
        applicantId: user.uid,
        applicantName: userProfile?.fullName || user.displayName || 'Usahawan Belia',
        applicantEmail: user.email || '',
        applicantPhone: userProfile?.phone || '-',
        businessName: businessName.trim(),
        businessCategory,
        ssmNumber: '-',
        bankName: 'Maybank',
        bankAccountNumber: '-',
        fundPurpose: `${fundPurpose.trim()} (Jajahan: ${district})`
      });

      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      setSubmitted(true);
      showToast({
        type: 'success',
        title: 'Permohonan Geran Berjaya Dihantar!',
        message: `Permohonan bagi ${programTitle} telah direkodkan. Semakan urusetia mengambil masa 3 hari bekerja.`
      });
      if (onSuccess) onSuccess(grantData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal menghantar permohonan. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmitted(false);
    setError(null);
    setFieldErrors({});
    setFundPurpose('');
    onClose();
  };

  const GRANT_PACKAGES = [
    {
      title: 'Dana Benih Usahawan Belia Kelantan (RM3,000)',
      amount: 'RM3,000',
      badge: 'Modal Permulaan',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
      description: 'Modal pusingan, pembelian kelengkapan kiosk & stok bahan mentah permulaan.'
    },
    {
      title: 'Geran Transformasi Digital & POS Kiosk (RM5,000)',
      amount: 'RM5,000',
      badge: 'Disyorkan Kerajaan Negeri',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold',
      description: 'Perkakasan POS tablet, sistem tanpa tunai DuitNow QR & promosi media sosial.'
    },
    {
      title: 'Skim Bantuan Pemasaran Kraf & Makanan Warisan (RM2,000)',
      amount: 'RM2,000',
      badge: 'Pemasaran & Jenama',
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
      description: 'Reka bentuk pembungkusan produk, pensijilan Halal/SSM & bahan pameran ekspo.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-[#24303F] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 scale-100 transition-all max-h-[90vh] flex flex-col overflow-hidden my-auto"
        role="dialog"
        aria-modal="true"
      >
        
        {/* TailAdmin Card Header - STICKY and SHRINK-0 to prevent clipping */}
        <div className="border-b border-slate-200 dark:border-slate-800 py-4 px-6 sm:px-7 flex items-center justify-between bg-white dark:bg-[#24303F] shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-400 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Permohonan Geran & Dana Benih Belia
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Skim Pemerkasaan Modal Perniagaan Negeri Kelantan & Universiti Malaysia Kelantan (UMK)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer interactive-press hover:rotate-90 duration-200"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {submitted ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50 dark:ring-emerald-950/40">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">Permohonan Geran Diterima!</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                Terima kasih, <strong>{user?.displayName || 'Usahawan Belia'}</strong>. Permohonan anda bagi <strong>{programTitle}</strong> bernilai <strong>{grantAmount}</strong> telah direkodkan. Urusetia akan menghubungi anda melalui WhatsApp untuk pengesahan dokumen.
              </p>
              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="py-2.5 px-6 rounded-lg text-xs sm:text-sm font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors cursor-pointer"
                >
                  Selesai & Kembali ke Dashboard
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {!user && (
                <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center justify-between gap-3 text-xs sm:text-sm">
                  <span className="text-red-900 dark:text-red-300 font-medium">
                    Sila log masuk untuk menghantar permohonan geran rasmi.
                  </span>
                  <button
                    type="button"
                    onClick={openLoginModal}
                    className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-lg cursor-pointer transition-colors shrink-0"
                  >
                    Log Masuk
                  </button>
                </div>
              )}

              {error && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs sm:text-sm rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Selectable Scheme Cards */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                    Pilih Skim Geran Bantuan: <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Pilih mengikut keperluan modal anda
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {GRANT_PACKAGES.map((pkg) => {
                    const isSelected = programTitle === pkg.title;
                    return (
                      <button
                        key={pkg.title}
                        type="button"
                        onClick={() => {
                          setProgramTitle(pkg.title);
                          setGrantAmount(pkg.amount);
                        }}
                        className={`p-4 rounded-xl text-left border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-red-700 bg-red-50/70 dark:bg-red-950/20 ring-1 ring-red-700/30 shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                              {pkg.title}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${pkg.badgeColor}`}>
                              {pkg.badge}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                            {pkg.description}
                          </p>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                          <span className="text-base sm:text-lg font-black text-red-700 dark:text-red-400 tabular-nums">
                            {pkg.amount}
                          </span>
                          <div className={`mt-1 w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected 
                              ? 'border-red-700 bg-red-700 text-white' 
                              : 'border-slate-300 dark:border-slate-600'
                          }`}>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Accordion: Syarat Kelayakan & Senarai Semak */}
              <div className="bg-slate-50 dark:bg-[#1A222C] p-4.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <HelpCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                    Panduan Permohonan & Syarat Kelayakan
                  </span>
                </div>
                <Accordion
                  items={[
                    {
                      id: 'grant-eligibility',
                      title: 'Syarat Kelayakan Pemohon Geran Belia',
                      badge: 'Kelayakan',
                      content: (
                        <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 leading-relaxed">
                          <p>• Warganegara Malaysia menetap di negeri Kelantan berumur 18-40 tahun.</p>
                          <p>• Mengusahakan perniagaan atau kiosk modular belia.</p>
                          <p>• Bersedia mengikuti sesi bimbingan mentor berkanun sekurang-kurangnya sekali sebulan.</p>
                        </div>
                      )
                    },
                    {
                      id: 'document-checklist',
                      title: 'Maklumat Pengesahan Permohonan',
                      badge: 'Panduan',
                      content: (
                        <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 leading-relaxed">
                          <p>✓ Butiran ringkas perniagaan dan cadangan penggunaan modal.</p>
                          <p>✓ Gambar produk atau perancangan tapak kiosk belia.</p>
                        </div>
                      )
                    }
                  ]}
                />
              </div>

              {/* Grouped Section: Business Info */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                      Nama Bisnes / Jenama: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nama perniagaan anda"
                      value={businessName}
                      onChange={(e) => {
                        setBusinessName(e.target.value);
                        if (fieldErrors.businessName) setFieldErrors(prev => ({ ...prev, businessName: '' }));
                      }}
                      className={`w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-transparent dark:bg-[#1A222C] border ${
                        fieldErrors.businessName ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-700 focus:border-red-600 focus:ring-red-600'
                      } text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 transition-all`}
                    />
                    {fieldErrors.businessName && (
                      <p className="mt-1.5 text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {fieldErrors.businessName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                      Kategori Perniagaan: <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={businessCategory}
                      onChange={(e) => setBusinessCategory(e.target.value as BusinessCategory)}
                      className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-transparent dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all cursor-pointer"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c} className="dark:bg-[#1A222C]">{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                    Jajahan Operasi Perniagaan: <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-transparent dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all cursor-pointer"
                  >
                    <option value="Kota Bharu" className="dark:bg-[#1A222C]">Kota Bharu</option>
                    <option value="Bachok" className="dark:bg-[#1A222C]">Bachok</option>
                    <option value="Pasir Mas" className="dark:bg-[#1A222C]">Pasir Mas</option>
                    <option value="Tumpat" className="dark:bg-[#1A222C]">Tumpat</option>
                    <option value="Tanah Merah" className="dark:bg-[#1A222C]">Tanah Merah</option>
                    <option value="Machang" className="dark:bg-[#1A222C]">Machang</option>
                    <option value="Pasir Puteh" className="dark:bg-[#1A222C]">Pasir Puteh</option>
                    <option value="Kuala Krai" className="dark:bg-[#1A222C]">Kuala Krai</option>
                    <option value="Gua Musang" className="dark:bg-[#1A222C]">Gua Musang</option>
                    <option value="Jeli" className="dark:bg-[#1A222C]">Jeli</option>
                  </select>
                </div>
              </div>

              {/* Fund Purpose */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                  Ringkasan Cadangan Penggunaan Dana: <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Nyatakan ringkasan penggunaan dana secara ringkas..."
                  value={fundPurpose}
                  onChange={(e) => {
                    setFundPurpose(e.target.value);
                    if (fieldErrors.fundPurpose) setFieldErrors(prev => ({ ...prev, fundPurpose: '' }));
                  }}
                  className={`w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-transparent dark:bg-[#1A222C] border ${
                    fieldErrors.fundPurpose ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-700 focus:border-red-600 focus:ring-red-600'
                  } text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 transition-all`}
                />
                {fieldErrors.fundPurpose && (
                  <p className="mt-1.5 text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {fieldErrors.fundPurpose}
                  </p>
                )}
              </div>

              {/* Auto-filled Identity Chip */}
              <div className="p-3.5 bg-slate-50 dark:bg-[#1A222C] rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Pemohon Berdaftar: <strong className="text-slate-800 dark:text-slate-200">{user?.displayName || userProfile?.fullName || 'Usahawan Belia'}</strong></span>
                <span>Emel Urusetia: <strong className="text-slate-800 dark:text-slate-200">{user?.email || 'N/A'}</strong></span>
              </div>

              {/* TailAdmin Action Buttons Footer */}
              <div className="flex justify-end items-center gap-3 pt-5 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="py-2.5 px-5 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="py-2.5 px-6 rounded-lg text-xs sm:text-sm font-semibold text-white bg-red-700 hover:bg-red-800 shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'Menghantar...' : `Hantar Permohonan Geran (${grantAmount})`}</span>
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
};
