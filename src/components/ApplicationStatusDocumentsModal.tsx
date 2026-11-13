import React, { useState } from 'react';
import { 
  FileText, 
  X, 
  CheckCircle2, 
  Clock, 
  Building2, 
  Award, 
  GraduationCap, 
  Printer, 
  Download, 
  ShieldCheck, 
  QrCode, 
  Lock, 
  ChevronRight,
  ExternalLink,
  MapPin,
  Calendar,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { CapsuleBooking, GrantApplication, MentorshipRegistration } from '../types';
import { showToast } from './ToastNotification';
import { formatDisplayDate, calculateOperationEndDate } from '../utils/printUtils';

interface ApplicationStatusDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userBooking: CapsuleBooking | null;
  grantApplications: GrantApplication[];
  mentorshipRegistrations: MentorshipRegistration[];
  onOpenBooking: () => void;
  onOpenGrantModal: () => void;
  onOpenMentorship: () => void;
  onOpenVerification?: (refCode?: string) => void;
  onCancelMentorship?: (registrationId: string) => void;
}

export const ApplicationStatusDocumentsModal: React.FC<ApplicationStatusDocumentsModalProps> = ({
  isOpen,
  onClose,
  userBooking,
  grantApplications,
  mentorshipRegistrations,
  onOpenBooking,
  onOpenGrantModal,
  onOpenMentorship,
  onOpenVerification,
  onCancelMentorship
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'offerLetter' | 'tenancy' | 'verify'>('status');
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  if (!isOpen) return null;

  // Reference codes
  const slotCode = userBooking?.slotCode || 'CAP-KB-01';
  const bookingRef = `KBN-${slotCode.replace('CAP-', '')}-2026-8819`;
  const applicantName = userBooking?.applicantName || 'Ahmad Nabil Bin Yusoff';
  const businessName = userBooking?.businessName || 'Kopi Tok Bali & Pastri Pantai';
  const hubLocation = userBooking?.hubLocation || 'Hub Belia KB Sentral';
  const userGrant = grantApplications[0];
  const userMentorship = mentorshipRegistrations.find(m => m.entrepreneurName.toLowerCase().includes(applicantName.toLowerCase()) || m.entrepreneurName.includes('Nabil')) || mentorshipRegistrations[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="w-full max-w-3xl bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[92vh] transition-all"
        role="dialog"
        aria-modal="true"
      >
        
        {/* Header */}
        <div className="kbelia-important-header dark:bg-slate-800 px-5 sm:px-7 py-4.5 flex items-center justify-between shrink-0 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center border border-sky-200 dark:border-sky-800">
              <ShieldCheck className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-widest text-sky-700 dark:text-sky-400">
                Pusat Urusan Rasmi KBelia
              </div>
              <h3 className="font-black text-base sm:text-lg text-slate-800 dark:text-white">
                Semakan Status Permohonan & Dokumen Tawaran
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Sub-Tabs */}
        <div className="flex items-center gap-2 px-5 sm:px-7 pt-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('status')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'status'
                ? 'border-sky-600 text-sky-700 dark:border-sky-400 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            1. Status Permohonan Semasa
          </button>

          <button
            onClick={() => setActiveTab('offerLetter')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'offerLetter'
                ? 'border-sky-600 text-sky-700 dark:border-sky-400 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>2. Surat Tawaran Kiosk</span>
          </button>

          <button
            onClick={() => setActiveTab('tenancy')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'tenancy'
                ? 'border-sky-600 text-sky-700 dark:border-sky-400 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>3. Perjanjian Sewaan (Tenancy)</span>
          </button>

          <button
            onClick={() => setActiveTab('verify')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'verify'
                ? 'border-sky-600 text-sky-700 dark:border-sky-400 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>4. Pengesahan Kod Digital</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">

          {/* TAB 1: STATUS PERMOHONAN SEMASA */}
          {activeTab === 'status' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Card 1: Modular Kiosk Status */}
              <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">
                        Skim Kiosk Modular Pintar
                      </span>
                      <h4 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-white">
                        Penempatan Kiosk: <span className="font-mono text-sky-700 dark:text-sky-400">{slotCode}</span>
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Lokasi: {hubLocation} &middot; Sewa Subsidi: <span className="font-bold text-slate-800 dark:text-white">RM150/bulan</span>
                      </p>
                    </div>
                  </div>

                  <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Permohonan Diluluskan</span>
                  </span>
                </div>

                <div className="pt-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="text-slate-600 dark:text-slate-300 text-[11px]">
                    No. Rujukan Rasmi: <span className="font-mono font-bold text-slate-800 dark:text-white">{bookingRef}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('offerLetter')}
                      className="px-3.5 py-1.5 rounded-xl font-bold bg-sky-600 hover:bg-sky-700 text-white transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Lihat Surat Tawaran</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('tenancy')}
                      className="px-3 py-1.5 rounded-xl font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    >
                      Perjanjian Sewa
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 2: SEED Grant Status */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center justify-center shrink-0">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Skim Bantuan Modal
                      </span>
                      <h4 className="font-bold text-sm sm:text-base text-slate-800 dark:text-white">
                        {userGrant?.programTitle || 'Dana Benih Usahawan Belia Kelantan (SEED)'}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Peruntukan: <span className="font-bold text-slate-800 dark:text-white">{userGrant?.grantAmount || 'RM3,000'}</span> &middot; Kegunaan: Modal Pusingan Stok & POS
                      </p>
                    </div>
                  </div>

                  <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Sedang Dinilai Urusetia</span>
                  </span>
                </div>

                <div className="pt-3 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>Dokumen SSM & Penyata Bank telah diterima lengkap oleh Urusetia UMK.</span>
                  <button
                    type="button"
                    onClick={onOpenGrantModal}
                    className="font-bold text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
                  >
                    Kemas Kini Borang &rarr;
                  </button>
                </div>
              </div>

              {/* Card 3: Mentorship Session Status */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">
                        Bimbingan Mentor UMK
                      </span>
                      <h4 className="font-bold text-sm sm:text-base text-slate-800 dark:text-white">
                        Klinik Usahawan bersama: <span className="text-sky-700 dark:text-sky-300">{userMentorship?.mentorName || 'Prof. Madya Dr. Wan Azhar'}</span>
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Topik: {userMentorship?.topic || 'Strategi TikTok Shop & Aliran Tunai'}
                      </p>
                    </div>
                  </div>

                  <span className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                    userMentorship?.status === 'confirmed'
                      ? 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border-sky-300'
                      : userMentorship?.status === 'completed'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                      : userMentorship?.status === 'cancelled'
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300'
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300'
                  }`}>
                    {userMentorship?.status === 'confirmed' 
                      ? '✓ Temujanji Disahkan' 
                      : userMentorship?.status === 'completed' 
                      ? '✓ Selesai' 
                      : userMentorship?.status === 'cancelled'
                      ? '✕ Pendaftaran Dibatalkan'
                      : '⏳ Menunggu Pengesahan'}
                  </span>
                </div>

                <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="text-slate-600 dark:text-slate-300 text-[11px] flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-sky-600" />
                    <span>{userMentorship?.preferredDate || '28 Mac 2026 (Sabtu)'} ({userMentorship?.preferredTime || '10:00 AM'})</span>
                    <span>&bull; {userMentorship?.mode || 'Bersemuka di Kampus'}</span>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {userMentorship && userMentorship.status !== 'completed' && userMentorship.status !== 'cancelled' && (
                      <button
                        type="button"
                        onClick={() => setIsCancelConfirmOpen(true)}
                        className="px-3 py-1 rounded-lg text-xs font-bold text-rose-700 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Batal Pendaftaran</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={onOpenMentorship}
                      className="font-bold text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
                    >
                      Pilihan Slot & Mentor &rarr;
                    </button>
                  </div>
                </div>

                {/* Mentorship Cancellation Confirmation Sub-Modal */}
                {isCancelConfirmOpen && (
                  <div className="mt-3 p-4 rounded-2xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 animate-in fade-in duration-200">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 shrink-0">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div className="flex-1 text-xs">
                        <h5 className="font-bold text-rose-900 dark:text-rose-200 text-sm">
                          Sahkan Pembatalan Sesi Bimbingan?
                        </h5>
                        <p className="text-rose-800/90 dark:text-rose-300/90 mt-1 leading-relaxed">
                          Adakah anda pasti ingin membatalkan pendaftaran sesi bimbingan bersama <strong>{userMentorship?.mentorName}</strong>? Slot masa ini akan dibebaskan untuk usahawan lain.
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            type="button"
                            onClick={() => {
                              if (userMentorship && onCancelMentorship) {
                                onCancelMentorship(userMentorship.id);
                              }
                              setIsCancelConfirmOpen(false);
                              showToast({
                                type: 'info',
                                title: 'Pendaftaran Dibatalkan',
                                message: `Pendaftaran sesi bimbingan bersama ${userMentorship?.mentorName || 'Mentor'} telah berjaya dibatalkan.`
                              });
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                          >
                            Ya, Batalkan Pendaftaran
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsCancelConfirmOpen(false)}
                            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                          >
                            Kekalkan Pendaftaran
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: SURAT TAWARAN KIOSK RASMI */}
          {activeTab === 'offerLetter' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  Surat tawaran rasmi boleh dicetak atau disimpan sebagai rujukan pihak berkuasa tempatan (PBT).
                </span>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Dokumen</span>
                </button>
              </div>

              {/* Printable Official Document Container (Crisp White for Print) */}
              <div className="bg-white text-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-md font-sans space-y-5 print:border-none print:shadow-none">
                
                {/* Letterhead */}
                <div className="flex items-center justify-between border-b-2 border-emerald-700 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-700 text-amber-200 flex items-center justify-center font-black text-lg border-2 border-amber-300">
                      KB
                    </div>
                    <div>
                      <h4 className="font-black text-base tracking-tight text-slate-900 uppercase">
                        PUSAT PEMBANGUNAN USAHAWAN BELIA KELANTAN (KBelia)
                      </h4>
                      <div className="text-[11px] font-semibold text-slate-600">
                        Dengan Kerjasama Institut Perusahaan & Keusahawanan Universiti Malaysia Kelantan (UMK)
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Bangunan Pentadbiran UMK Kampus Kota, Pengkalan Chepa, 16100 Kota Bharu, Kelantan
                      </div>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-[10px] font-mono text-slate-500">NO. RUJUKAN:</div>
                    <div className="text-xs font-mono font-bold text-emerald-700">{bookingRef}</div>
                    <div className="text-[10px] text-slate-500 mt-1">TARIKH: 24 MAC 2026</div>
                  </div>
                </div>

                {/* Recipient Details */}
                <div className="text-xs space-y-1">
                  <div><strong>Kepada:</strong> {applicantName}</div>
                  <div><strong>Nama Perniagaan:</strong> {businessName}</div>
                  <div><strong>Status Permohonan:</strong> <span className="text-emerald-700 font-bold uppercase">DILULUSKAN (TAWARAN PENEMPATAN)</span></div>
                </div>

                {/* Letter Content */}
                <div className="text-xs leading-relaxed space-y-3 text-slate-800">
                  <p className="font-bold underline uppercase">
                    TAWARAN PENEMPATAN & SEWAAN BERSUBSIDI KIOSK MODULAR PINTAR KBelia SESI 2026
                  </p>
                  <p>
                    Sukacita dimaklumkan bahawa Jawatankuasa Pemilihan Usahawan Belia Negeri Kelantan telah meluluskan permohonan anda bagi penempatan kiosk modular pintar di bawah program inisiatif keusahawanan belia negeri.
                  </p>
                  
                  {/* Table of Details */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Kod Kiosk Ditetapkan:</span>
                      <span className="font-mono font-bold text-emerald-800">{slotCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Lokasi Hab Perniagaan:</span>
                      <span className="font-bold text-slate-900">{hubLocation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Kadar Sewaan Bersubsidi:</span>
                      <span className="font-bold text-emerald-800">RM150.00 / Sebulan (Kadar Asal Pasaran: RM450)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Tarikh Mula Operasi:</span>
                      <span className="font-bold text-slate-900">{formatDisplayDate(userBooking?.startDate || '2026-06-01')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Tarikh Akhir Beroperasi:</span>
                      <span className="font-bold text-emerald-800">{calculateOperationEndDate(userBooking?.startDate || '2026-06-01', userBooking?.durationMonths || 6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Kemudahan Termasuk:</span>
                      <span className="text-slate-800">Bekalan Solar & Elektrik, Rak Display, Kunci Digital Pintar</span>
                    </div>
                  </div>

                  <p>
                    Anda dikehendaki menyemak terma perjanjian penyewaan dan memulakan operasi dalam tempoh 14 hari dari tarikh surat ini dikeluarkan.
                  </p>
                </div>

                {/* Sign-off & Digital Stamp */}
                <div className="pt-4 border-t border-slate-200 flex items-end justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-slate-900">Prof. Madya Dr. Wan Azhar</div>
                    <div className="text-[10px] text-slate-600">Penyelaras Keusahawanan UMK & Urusetia KBelia Kelantan</div>
                    <div className="text-[9px] text-slate-400 mt-1">Dokumen ditandatangani secara digital mengikut Akta Tandatangan Digital 1997.</div>
                  </div>

                  <div className="w-20 h-20 rounded-xl border border-emerald-200 bg-emerald-50/80 p-1.5 flex flex-col items-center justify-center text-center shrink-0">
                    <QrCode className="w-8 h-8 text-emerald-800 mb-0.5" />
                    <span className="text-[8px] font-mono font-bold text-emerald-800">VERIFIED</span>
                    <span className="text-[7px] text-slate-500">HASH: 8819-KB</span>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: PERJANJIAN SEWAAN (TENANCY AGREEMENT) */}
          {activeTab === 'tenancy' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-white uppercase">
                      Ringkasan Terma Perjanjian Sewaan Kiosk Modular
                    </h4>
                    <span className="text-[11px] text-slate-500">Antara KBelia/PBT dan Penyewa Kiosk {applicantName}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Aktif
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <strong className="text-slate-800 dark:text-white block mb-0.5">Klausa 1: Tempoh Sewaan & Pembayaran</strong>
                    <p className="text-[11px]">
                      Sewaan bermula pada awal bulan dengan tempoh percubaan minima 6 bulan. Bayaran subsidi RM150/bulan hendaklah diselesaikan selewat-lewatnya pada 7hb setiap bulan melalui akaun rasmi UMK/KBelia.
                    </p>
                  </div>

                  <div>
                    <strong className="text-slate-800 dark:text-white block mb-0.5">Klausa 2: Waktu Operasi & Kebersihan</strong>
                    <p className="text-[11px]">
                      Penyewa dikehendaki membuka kiosk sekurang-kurangnya 5 hari seminggu. Kebersihan perimeter kiosk dalam lingkungan 2 meter adalah tanggungjawab penyewa.
                    </p>
                  </div>

                  <div>
                    <strong className="text-slate-800 dark:text-white block mb-0.5">Klausa 3: Keselamatan & Soket Elektrik</strong>
                    <p className="text-[11px]">
                      Sebarang penggunaan peralatan berkuasa tinggi melebihi 2000W wajib dilaporkan melalui Kaunter Aduan Fasiliti bagi mengelakkan suis pintas.
                    </p>
                  </div>

                  <div>
                    <strong className="text-slate-800 dark:text-white block mb-0.5">Klausa 4: Penyertaan Klinik Bimbingan Mentor</strong>
                    <p className="text-[11px]">
                      Penyewa disyaratkan menghadiri sekurang-kurangnya 1 sesi bimbingan mentor percuma UMK setiap 3 bulan bagi mengekalkan kelayakan subsidi sewa bulanan.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Perjanjian Disahkan Secara Digital
                  </span>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="font-bold text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
                  >
                    Muat Turun Salinan Lengkap &rarr;
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PENGESAHAN KOD DIGITAL (VERIFICATION) */}
          {activeTab === 'verify' && (
            <div className="space-y-4 animate-in fade-in duration-200 text-center py-4">
              <div className="w-16 h-16 rounded-3xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto border border-sky-200 dark:border-sky-800">
                <QrCode className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-base text-slate-800 dark:text-white">
                Pengesah Ketulenan Dokumen & Kiosk KBelia
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                Kod rujukan dokumen anda dilindungi dengan jejak digital rasmi untuk mengelakkan pemalsuan lesen atau surat penempatan di pihak berkuasa tempatan.
              </p>

              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-sm mx-auto font-mono text-xs">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Kod Hash Rujukan:</div>
                <div className="font-bold text-sky-700 dark:text-sky-400 text-sm mt-0.5">{bookingRef}</div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> REKOD SAH DALAM PANGKALAN DATA NEGERI
                </div>
              </div>

              {onOpenVerification && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenVerification(bookingRef);
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-sm transition-colors cursor-pointer"
                >
                  Buka Portal Pengesahan Awam PBT
                </button>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:px-7 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            Perlukan bantuan sokongan? Hubungi Urusetia UMK di <span className="font-bold text-slate-700 dark:text-slate-300">09-771 7000</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
