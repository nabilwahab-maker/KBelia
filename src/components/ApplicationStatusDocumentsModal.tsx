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
  XCircle,
  Loader2
} from 'lucide-react';
import { CapsuleBooking, GrantApplication, MentorshipRegistration, normalizeMentorshipMode } from '../types';
import { showToast } from './ToastNotification';
import {
  formatDisplayDate,
  calculateOperationEndDate,
  openAndPrintDocument,
  generateOfferLetterOfficialHtml,
  generateTenancyAgreementOfficialHtml
} from '../utils/printUtils';
import { downloadOfferLetterPdf, downloadHtmlAsPdf } from '../utils/pdfGenerator';
import { loadLocalPortalSettings } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { getDashboardRole, getRoleTheme } from '../utils/roleTheme';
import { MiddleTruncate } from './TypographyPrimitives';
import { QrCodeGraphic } from './QrCodeGraphic';
import { buildVerificationQrPayload } from '../utils/qrUtils';

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
  const { isAdmin, isMentor } = useAuth();
  const roleTheme = getRoleTheme(getDashboardRole(isAdmin, isMentor));
  const [activeTab, setActiveTab] = useState<'status' | 'offerLetter' | 'tenancy' | 'verify'>('status');
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<'print' | 'pdf' | null>(null);

  if (!isOpen) return null;

  // Reference codes derived strictly from active user booking
  const slotCode = userBooking?.slotCode || '';
  const bookingYear = new Date(userBooking?.createdAt || Date.now()).getFullYear();
  const currentYear = new Date().getFullYear();
  const bookingRef = userBooking ? `KBN-${slotCode.replace('CAP-', '')}-${bookingYear}-8819` : '';
  const tenancyRef = userBooking ? `AGR-${slotCode}-${bookingYear}` : '';
  const applicantName = userBooking?.applicantName || '';
  const businessName = userBooking?.businessName || '';
  const hubLocation = userBooking?.hubLocation || '';
  const subsidyRate = Number(loadLocalPortalSettings().portalSubsidyRate ?? 50);
  const monthlyRate = userBooking?.monthlyRate || 150;
  const marketRate =
    subsidyRate > 0 && subsidyRate < 100
      ? Math.round(monthlyRate / (1 - subsidyRate / 100))
      : monthlyRate * 2;
  const formattedIssueDate = userBooking
    ? new Date(userBooking.createdAt || Date.now()).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const userGrant = grantApplications.find(g => g.status !== 'cancelled') || null;
  const userMentorship = mentorshipRegistrations[0] || null;

  const handlePrint = async (docType: 'offerLetter' | 'tenancy' = activeTab === 'tenancy' ? 'tenancy' : 'offerLetter') => {
    if (!userBooking || busyAction) return;
    setBusyAction('print');
    try {
      const html =
        docType === 'tenancy'
          ? generateTenancyAgreementOfficialHtml(userBooking, tenancyRef, formattedIssueDate, subsidyRate)
          : generateOfferLetterOfficialHtml(userBooking, bookingRef, formattedIssueDate, subsidyRate);
      await openAndPrintDocument(
        html,
        docType === 'tenancy'
          ? `Perjanjian_Sewa_Kiosk_${slotCode}`
          : `Surat_Tawaran_Kiosk_${slotCode}`
      );
    } catch {
      showToast({ type: 'error', title: 'Ralat Cetakan', message: 'Gagal membuka pratonton cetakan rasmi.' });
    } finally {
      setTimeout(() => setBusyAction(null), 500);
    }
  };

  const handleDownloadPdf = async (docType: 'offerLetter' | 'tenancy') => {
    if (!userBooking || busyAction) return;
    setBusyAction('pdf');
    try {
      let ok = false;
      if (docType === 'tenancy') {
        const html = generateTenancyAgreementOfficialHtml(userBooking, tenancyRef, formattedIssueDate, subsidyRate);
        ok = await downloadHtmlAsPdf(html, `Perjanjian_Sewa_Kiosk_${slotCode}_${tenancyRef}.pdf`);
      } else {
        ok = await downloadOfferLetterPdf(userBooking, bookingRef, formattedIssueDate, `Surat_Tawaran_Kiosk_${slotCode}_${bookingRef}.pdf`, subsidyRate);
      }
      if (ok) {
        showToast({
          type: 'success',
          title: 'PDF Rasmi Dimuat Turun',
          message: docType === 'tenancy' ? 'Perjanjian sewa rasmi A4 berjaya disimpan.' : 'Surat tawaran rasmi A4 berjaya disimpan.'
        });
      } else {
        showToast({
          type: 'error',
          title: 'Gagal Menjana PDF',
          message: 'Sila cuba butang Cetak sebagai alternatif.'
        });
      }
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="w-full max-w-3xl bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-300 dark:border-slate-600 overflow-hidden flex flex-col max-h-[92vh] transition-all"
        role="dialog"
        aria-modal="true"
      >
        
        {/* Header */}
        <div className={`${roleTheme.surfaceMutedClass} px-5 sm:px-7 py-4.5 flex items-center justify-between shrink-0 border-b ${roleTheme.dividerClass}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl ${roleTheme.activeMiniBtnClass} flex items-center justify-center border`}>
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className={`text-[0.8125rem] font-extrabold uppercase tracking-widest ${roleTheme.accentTextClass}`}>
                Pusat Urusan Rasmi KBelia
              </div>
              <h3 className="font-black text-base sm:text-lg text-black dark:text-white">
                Semakan Status Permohonan & Dokumen Tawaran
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className={roleTheme.iconButtonClass}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Sub-Tabs */}
        <div className={`flex items-center gap-2 px-5 sm:px-7 pt-4 border-b ${roleTheme.dividerClass} ${roleTheme.surfaceMutedClass} shrink-0 overflow-x-auto`}>
          <button
            onClick={() => setActiveTab('status')}
            className={`pb-3 px-3 text-sm font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'status'
                ? roleTheme.tabActiveUnderlineClass
                : roleTheme.tabIdleUnderlineClass
            }`}
          >
            <span className="kbelia-reserved-bold kbelia-trim" data-reserved-text="Status Permohonan">Status Permohonan</span>
          </button>

          <button
            onClick={() => setActiveTab('offerLetter')}
            className={`pb-3 px-3 text-sm font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'offerLetter'
                ? roleTheme.tabActiveUnderlineClass
                : roleTheme.tabIdleUnderlineClass
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="kbelia-reserved-bold kbelia-trim" data-reserved-text="Surat Tawaran">Surat Tawaran</span>
          </button>

          <button
            onClick={() => setActiveTab('tenancy')}
            className={`pb-3 px-3 text-sm font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'tenancy'
                ? roleTheme.tabActiveUnderlineClass
                : roleTheme.tabIdleUnderlineClass
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span className="kbelia-reserved-bold kbelia-trim" data-reserved-text="Perjanjian Sewa">Perjanjian Sewa</span>
          </button>

          <button
            onClick={() => setActiveTab('verify')}
            className={`pb-3 px-3 text-sm font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'verify'
                ? roleTheme.tabActiveUnderlineClass
                : roleTheme.tabIdleUnderlineClass
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span className="kbelia-reserved-bold kbelia-trim" data-reserved-text="Sahkan Kod">Sahkan Kod</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">

          {/* TAB 1: STATUS PERMOHONAN SEMASA */}
          {activeTab === 'status' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Card 1: Modular Kiosk Status */}
              {userBooking ? (
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-300 dark:border-slate-600">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${roleTheme.activeMiniBtnClass} border flex items-center justify-center shrink-0`}>
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[0.8125rem] font-bold uppercase tracking-wider text-black dark:text-white/75">
                          Skim Kiosk Modular Pintar
                        </span>
                        <h4 className="font-extrabold text-sm sm:text-base text-black dark:text-white">
                          Penempatan Kiosk: <span className="font-mono text-black dark:text-white/75">{slotCode}</span>
                        </h4>
                        <p className="text-[0.9375rem] text-black dark:text-white/75">
                          Lokasi: {hubLocation} &middot; Sewa Subsidi: <span className="font-bold text-black dark:text-white tabular-nums">RM{monthlyRate}/bulan</span>
                        </p>
                      </div>
                    </div>

                    <span className={`self-start sm:self-auto text-[0.8125rem] font-bold flex items-center gap-1.5 ${
                      userBooking.status === 'approved'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : userBooking.status === 'rejected' || userBooking.status === 'cancelled'
                          ? 'text-rose-700 dark:text-rose-400'
                          : 'text-amber-700 dark:text-amber-300'
                    }`}>
                      {userBooking.status === 'approved' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      <span>
                        {userBooking.status === 'approved'
                          ? 'Permohonan Diluluskan'
                          : userBooking.status === 'cancelled'
                          ? 'Dibatalkan'
                          : userBooking.status === 'rejected'
                          ? 'Tidak Berjaya'
                          : 'Sedang Disemak'}
                      </span>
                    </span>
                  </div>

                  <div className="pt-3.5 flex flex-wrap items-center justify-between gap-3 text-sm">
                    <div className="text-black dark:text-white text-[0.8125rem]">
                      Nombor Rujukan Rasmi: <MiddleTruncate text={bookingRef} startChars={10} endChars={6} className="font-mono font-bold text-black dark:text-white" />
                    </div>
                    {userBooking.status === 'approved' && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveTab('offerLetter')}
                          className={roleTheme.compactPrimaryButtonClass}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Surat Tawaran</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('tenancy')}
                          className={roleTheme.compactSecondaryButtonClass}
                        >
                          Perjanjian
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 text-black/70 dark:text-white/75 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-black dark:text-white">Tiada Permohonan Kiosk Aktif</h4>
                      <p className="text-[0.9375rem] text-black/70 dark:text-white/75">Anda belum menghantar sebarang permohonan sewaan kiosk.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { onClose(); onOpenBooking(); }}
                    className={roleTheme.compactPrimaryButtonClass}
                  >
                    Mohon Kiosk
                  </button>
                </div>
              )}

              {/* Card 2: SEED Grant Status */}
              {userGrant ? (
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-300 dark:border-slate-600">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-black dark:text-white/75 border border-amber-200 dark:border-amber-800 flex items-center justify-center shrink-0">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[0.8125rem] font-bold uppercase tracking-wider text-black/70 dark:text-white/75">
                          Skim Bantuan Modal
                        </span>
                        <h4 className="font-bold text-sm sm:text-base text-black dark:text-white">
                          {userGrant.programTitle}
                        </h4>
                        <p className="text-[0.9375rem] text-black dark:text-white/75">
                          Peruntukan: <span className="font-bold text-black dark:text-white">{userGrant.grantAmount}</span> &middot; {userGrant.businessName}
                        </p>
                      </div>
                    </div>

                    <span className={`self-start sm:self-auto text-[0.8125rem] font-bold flex items-center gap-1.5 ${
                      userGrant.status === 'approved'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : userGrant.status === 'rejected' || userGrant.status === 'cancelled'
                          ? 'text-rose-700 dark:text-rose-400'
                          : 'text-amber-700 dark:text-amber-300'
                    }`}>
                      <Clock className="w-4 h-4" />
                      <span>
                        {userGrant.status === 'approved' ? 'Diluluskan' : userGrant.status === 'rejected' ? 'Ditolak' : userGrant.status === 'cancelled' ? 'Dibatalkan' : 'Sedang Disemak Admin'}
                      </span>
                    </span>
                  </div>

                  <div className="pt-3 flex items-center justify-between text-sm text-black dark:text-white/75">
                    <span>{userGrant.adminNotes || 'Permohonan geran telah direkodkan oleh Pentadbir KBelia.'}</span>
                    <button
                      type="button"
                      onClick={() => { onClose(); onOpenGrantModal(); }}
                      className="font-bold text-black dark:text-white/75 hover:underline cursor-pointer shrink-0 ml-2"
                    >
                      Mohon Geran
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 text-black/70 dark:text-white/75 flex items-center justify-center shrink-0">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-black dark:text-white">Tiada Permohonan Geran Aktif</h4>
                      <p className="text-[0.9375rem] text-black/70 dark:text-white/75">Mohon skim dana permulaan atau transformasi digital untuk bisnes anda.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { onClose(); onOpenGrantModal(); }}
                    className={roleTheme.compactSecondaryButtonClass}
                  >
                    Mohon Geran
                  </button>
                </div>
              )}

              {/* Card 3: Mentorship Session Status */}
              {userMentorship ? (
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-300 dark:border-slate-600">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#0B6E52]/10 dark:bg-[#10B981]/20 text-[#0B6E52] dark:text-[#34D399] border border-[#0B6E52]/25 dark:border-[#34D399]/35 flex items-center justify-center shrink-0">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[0.8125rem] font-bold uppercase tracking-wider text-black dark:text-white/75">
                          Bimbingan Mentor KBelia
                        </span>
                        <h4 className="font-bold text-sm sm:text-base text-black dark:text-white">
                          Klinik Usahawan bersama: <span className="text-black dark:text-white">{userMentorship.mentorName}</span>
                        </h4>
                        <p className="text-[0.9375rem] text-black dark:text-white/75">
                          Topik: {userMentorship.topic}
                        </p>
                      </div>
                    </div>

                    <span className={`self-start sm:self-auto text-[0.8125rem] font-bold flex items-center gap-1.5 ${
                      userMentorship.status === 'confirmed'
                        ? 'text-sky-700 dark:text-sky-300'
                        : userMentorship.status === 'completed'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : userMentorship.status === 'cancelled'
                        ? 'text-rose-700 dark:text-rose-400'
                        : 'text-amber-700 dark:text-amber-300'
                    }`}>
                      {userMentorship.status === 'confirmed'
                        ? 'Temujanji Disahkan'
                        : userMentorship.status === 'completed'
                        ? 'Selesai'
                        : userMentorship.status === 'cancelled'
                        ? 'Dibatalkan'
                        : 'Menunggu Pengesahan'}
                    </span>
                  </div>

                  <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
                    <div className="text-black dark:text-white text-[0.8125rem] flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-black dark:text-white" />
                      <span>{userMentorship.preferredDate} ({userMentorship.preferredTime})</span>
                      <span>&bull; {normalizeMentorshipMode(userMentorship.mode)}</span>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {userMentorship.status !== 'completed' && userMentorship.status !== 'cancelled' && (
                        <button
                          type="button"
                          onClick={() => setIsCancelConfirmOpen(true)}
                          className={`px-3 py-1.5 text-[0.8125rem] ${roleTheme.dangerOutlineButtonClass}`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Batal</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => { onClose(); onOpenMentorship(); }}
                        className={roleTheme.compactSecondaryButtonClass}
                      >
                        Pilih Mentor
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 text-black/70 dark:text-white/75 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-black dark:text-white">Tiada Temujanji Klinik Mentor</h4>
                      <p className="text-[0.9375rem] text-black/70 dark:text-white/75">Tempah sesi bimbingan perniagaan bersama mentor KBelia.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { onClose(); onOpenMentorship(); }}
                    className={roleTheme.compactSecondaryButtonClass}
                  >
                    Tempah
                  </button>
                </div>
              )}

                {/* Mentorship Cancellation Confirmation Sub-Modal */}
                {isCancelConfirmOpen && (
                  <div className="mt-3 p-4 rounded-2xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 animate-in fade-in duration-200">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-black dark:text-white shrink-0">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div className="flex-1 text-sm">
                        <h5 className="font-bold text-black dark:text-white text-sm">
                          Sahkan Pembatalan Sesi Bimbingan?
                        </h5>
                        <p className="text-black dark:text-white mt-1 leading-relaxed">
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
                            className={`px-3.5 py-1.5 text-sm shadow-xs ${roleTheme.dangerButtonClass}`}
                          >
                            Ya, Batal
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsCancelConfirmOpen(false)}
                            className={roleTheme.compactSecondaryButtonClass}
                          >
                            Kekalkan
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

            </div>
          )}

          {/* TAB 2: SURAT TAWARAN KIOSK RASMI */}
          {activeTab === 'offerLetter' && (
            !userBooking || userBooking.status !== 'approved' ? (
              <div className="py-12 text-center space-y-3">
                <FileText className="w-10 h-10 text-black/35 dark:text-white/35 mx-auto" />
                <h4 className="font-bold text-sm text-black dark:text-white">Surat Tawaran Belum Tersedia</h4>
                <p className="text-[0.9375rem] text-black/70 dark:text-white/75 max-w-md mx-auto">
                  Surat tawaran digital akan dijana secara automatik sebaik sahaja permohonan kiosk anda diluluskan oleh pihak Pentadbir KBelia.
                </p>
              </div>
            ) : (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-300 dark:border-slate-600">
                <span className="text-sm text-black dark:text-white/75">
                  Surat tawaran rasmi boleh dicetak atau disimpan sebagai rujukan pihak berkuasa tempatan (PBT).
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => void handleDownloadPdf('offerLetter')}
                    disabled={Boolean(busyAction)}
                    className={roleTheme.compactSecondaryButtonClass}
                  >
                    {busyAction === 'pdf' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    <span>{busyAction === 'pdf' ? 'Menjana...' : 'Muat Turun PDF'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handlePrint('offerLetter')}
                    disabled={Boolean(busyAction)}
                    className={roleTheme.compactPrimaryButtonClass}
                  >
                    {busyAction === 'print' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
                    <span>{busyAction === 'print' ? 'Membuka...' : 'Cetak'}</span>
                  </button>
                </div>
              </div>

              {/* Printable Official Document Container (Crisp White for Print) */}
              <div className="bg-white text-black p-6 sm:p-8 rounded-2xl border border-slate-300 shadow-md font-sans space-y-5 print:border-none print:shadow-none">
                
                {/* Letterhead */}
                <div className="flex items-center justify-between border-b-2 border-emerald-700 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black text-lg border-2 border-amber-300">
                      KB
                    </div>
                    <div>
                      <h4 className="font-black text-base tracking-tight text-black uppercase">
                        PUSAT PEMBANGUNAN USAHAWAN BELIA KELANTAN (KBelia)
                      </h4>
                      <div className="text-[0.8125rem] font-semibold text-black">
                        Inisiatif Hab Usahawan Belia Negeri Kelantan
                      </div>
                      <div className="text-[0.8125rem] text-black/70">
                        Pusat Operasi Hab Usahawan Belia Kelantan, 15000 Kota Bharu, Kelantan
                      </div>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-[0.8125rem] font-mono text-black/70">NO. RUJUKAN:</div>
                    <div className="text-[0.8125rem] font-mono font-bold text-black">{bookingRef}</div>
                    <div className="text-[0.8125rem] text-black/70 mt-1">TARIKH: {formatDisplayDate(userBooking.createdAt)}</div>
                  </div>
                </div>

                {/* Recipient Details */}
                <div className="text-sm space-y-1">
                  <div><strong>Kepada:</strong> {applicantName}</div>
                  <div><strong>Nama Perniagaan:</strong> {businessName}</div>
                  <div><strong>Status Permohonan:</strong> <span className="text-black font-bold uppercase">DILULUSKAN (TAWARAN PENEMPATAN)</span></div>
                </div>

                {/* Letter Content */}
                <div className="text-sm leading-relaxed space-y-3 text-black">
                  <p className="font-bold underline uppercase">
                    TAWARAN PENEMPATAN & SEWAAN BERSUBSIDI KIOSK MODULAR PINTAR KBelia SESI {new Date(userBooking.createdAt || Date.now()).getFullYear()}
                  </p>
                  <p>
                    Sukacita dimaklumkan bahawa Jawatankuasa Pemilihan Usahawan Belia Negeri Kelantan telah meluluskan permohonan anda bagi penempatan kiosk modular pintar di bawah program inisiatif keusahawanan belia negeri.
                  </p>
                  
                  {/* Table of Details */}
                  <div className="bg-slate-50 border border-slate-300 rounded-xl p-3 space-y-1.5 text-[0.8125rem]">
                    <div className="flex justify-between">
                      <span className="text-black">Kod Kiosk Ditetapkan:</span>
                      <span className="font-mono font-bold text-black">{slotCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black">Lokasi Hab Perniagaan:</span>
                      <span className="font-bold text-black">{hubLocation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black">Kadar Sewaan Bersubsidi:</span>
                      <span className="font-bold text-black tabular-nums">RM{monthlyRate.toFixed(2)} / Sebulan (Kadar Asal Pasaran: RM{marketRate})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black">Tarikh Mula Operasi:</span>
                      <span className="font-bold text-black">{formatDisplayDate(userBooking.startDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black">Tarikh Akhir Beroperasi:</span>
                      <span className="font-bold text-black">{calculateOperationEndDate(userBooking.startDate, userBooking.durationMonths)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black">Kemudahan Termasuk:</span>
                      <span className="text-black">Bekalan Elektrik, Rak Display, Kunci Digital Pintar</span>
                    </div>
                  </div>

                  <p>
                    Anda dikehendaki menyemak terma perjanjian penyewaan dan memulakan operasi dalam tempoh 14 hari dari tarikh surat ini dikeluarkan.
                  </p>
                </div>

                {/* Sign-off & Digital Stamp */}
                <div className="pt-4 border-t border-slate-300 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <div className="text-sm font-bold text-black">Pentadbiran Hab Kapsul Niaga Belia (KBelia)</div>
                    <div className="text-[0.8125rem] text-black">Pentadbiran &amp; Urusetia Portal KBelia Kelantan</div>
                    <div className="text-[0.8125rem] text-black/70 mt-1">Dokumen ditandatangani secara digital mengikut Akta Tandatangan Digital 1997.</div>
                  </div>

                  <div className="rounded-xl border border-slate-300 bg-slate-50 px-2.5 py-2 flex flex-col items-center justify-center text-center shrink-0">
                    <QrCodeGraphic
                      value={buildVerificationQrPayload(bookingRef)}
                      size={74}
                      caption="DISAHKAN"
                      subcaption={slotCode}
                    />
                  </div>
                </div>

              </div>

            </div>
            )
          )}

          {/* TAB 3: PERJANJIAN SEWAAN (TENANCY AGREEMENT) */}
          {activeTab === 'tenancy' && (
            !userBooking || userBooking.status !== 'approved' ? (
              <div className="py-12 text-center space-y-3">
                <Award className="w-10 h-10 text-black/35 dark:text-white/35 mx-auto" />
                <h4 className="font-bold text-sm text-black dark:text-white">Perjanjian Sewaan Belum Tersedia</h4>
                <p className="text-[0.9375rem] text-black/70 dark:text-white/75 max-w-md mx-auto">
                  Terma perjanjian sewaan rasmi hanya diaktifkan selepas permohonan kapsul anda diluluskan.
                </p>
              </div>
            ) : (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 space-y-4 text-sm leading-relaxed text-black dark:text-white">
                <div className="flex items-center justify-between pb-3 border-b border-slate-300 dark:border-slate-600">
                  <div>
                    <h4 className="font-bold text-sm text-black dark:text-white uppercase">
                      Ringkasan Terma Perjanjian Sewaan Kiosk Modular
                    </h4>
                    <span className="text-[0.8125rem] text-black/70">Antara KBelia/PBT dan Penyewa Kiosk {applicantName}</span>
                  </div>
                  <span className={`text-[0.8125rem] font-bold ${userBooking.tenancySigned ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-300'}`}>
                    {userBooking.tenancySigned ? 'Dimeterai' : 'Menunggu Tandatangan'}
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <strong className="text-black dark:text-white block mb-0.5">Klausa 1: Tempoh Sewaan & Pembayaran</strong>
                    <p className="text-[0.875rem]">
                      Sewaan bermula pada {formatDisplayDate(userBooking.startDate)} bagi tempoh {userBooking.durationMonths} bulan. Bayaran subsidi RM{monthlyRate}/bulan hendaklah diselesaikan selewat-lewatnya pada 7hb setiap bulan melalui akaun rasmi KBelia.
                    </p>
                  </div>

                  <div>
                    <strong className="text-black dark:text-white block mb-0.5">Klausa 2: Waktu Operasi & Kebersihan</strong>
                    <p className="text-[0.875rem]">
                      Penyewa dikehendaki membuka kiosk sekurang-kurangnya 5 hari seminggu. Kebersihan perimeter kiosk dalam lingkungan 2 meter adalah tanggungjawab penyewa.
                    </p>
                  </div>

                  <div>
                    <strong className="text-black dark:text-white block mb-0.5">Klausa 3: Keselamatan & Soket Elektrik</strong>
                    <p className="text-[0.875rem]">
                      Sebarang penggunaan peralatan berkuasa tinggi melebihi 2000W wajib dilaporkan melalui Kaunter Aduan Fasiliti bagi mengelakkan suis pintas.
                    </p>
                  </div>

                  <div>
                    <strong className="text-black dark:text-white block mb-0.5">Klausa 4: Penyertaan Klinik Bimbingan Mentor</strong>
                    <p className="text-[0.875rem]">
                      Penyewa disyaratkan menghadiri sekurang-kurangnya 1 sesi bimbingan mentor percuma KBelia setiap 3 bulan bagi mengekalkan kelayakan subsidi sewa bulanan.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-300 dark:border-slate-600 flex flex-wrap items-center justify-between gap-2 text-[0.8125rem]">
                  <span className="text-black dark:text-white/75 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> {userBooking.tenancySigned ? 'Perjanjian Disahkan Secara Digital' : 'Sedia Untuk Tandatangan Digital'}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleDownloadPdf('tenancy')}
                      className="font-bold text-black dark:text-white/75 hover:underline cursor-pointer"
                    >
                      Muat Turun PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePrint('tenancy')}
                      className="font-bold text-black dark:text-white/75 hover:underline cursor-pointer"
                    >
                      Cetak Salinan &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </div>
            )
          )}

          {/* TAB 4: PENGESAHAN KOD DIGITAL (VERIFICATION) */}
          {activeTab === 'verify' && (() => {
            const verifyCode = bookingRef || `REG-${currentYear}-BELIA`;
            return (
              <div className="space-y-4 animate-in fade-in duration-200 text-center py-4">
                <div className="flex justify-center">
                  <QrCodeGraphic
                    value={buildVerificationQrPayload(verifyCode)}
                    size={148}
                    caption="KOD QR KETULENAN"
                    subcaption={verifyCode}
                    showDownloadButton
                    downloadFileName={`QR_Pengesahan_${verifyCode}.png`}
                  />
                </div>
                <h4 className="font-bold text-base text-black dark:text-white">
                  Pengesah Ketulenan Dokumen &amp; Kiosk KBelia
                </h4>
                <p className="text-[0.9375rem] text-black dark:text-white/75 max-w-md mx-auto">
                  Imbas kod QR di atas atau gunakan nombor rujukan rasmi untuk menyemak ketulenan dokumen di pihak berkuasa tempatan.
                </p>

                {onOpenVerification && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenVerification(verifyCode);
                    }}
                    className={`px-5 py-2 text-sm shadow-sm ${roleTheme.primaryButtonClass}`}
                  >
                    Buka Portal Pengesahan QR
                  </button>
                )}
              </div>
            );
          })()}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:px-7 border-t border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 flex items-center justify-between shrink-0">
          <div className="text-[0.8125rem] text-black/70">
            Perlukan bantuan? Hubungi Khidmat Bantuan KBelia di <span className="font-bold text-black dark:text-white">09-771 7000</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`px-5 py-2 text-sm ${roleTheme.secondaryButtonClass}`}
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
