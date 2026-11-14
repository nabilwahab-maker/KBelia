import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Lock,
  Search,
  MapPin,
  Video,
  Send,
  ExternalLink,
  AlertCircle,
  History,
  UserCheck,
  ChevronRight,
  X,
  FileText
} from 'lucide-react';
import { KelantanDistrict, MentorProfile, MentorshipRegistration } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface MentorshipPageProps {
  mentors: MentorProfile[];
  registrations: MentorshipRegistration[];
  onBookMentorship: (registration: MentorshipRegistration) => boolean | void;
  onCancelMentorship: (registration: MentorshipRegistration) => void;
  defaultEntrepreneurName: string;
  defaultEntrepreneurEmail: string;
  defaultBusinessName: string;
  defaultPhone?: string;
  defaultDistrict?: KelantanDistrict;
}

const KELANTAN_DISTRICTS: KelantanDistrict[] = [
  'Kota Bharu',
  'Bachok',
  'Pasir Mas',
  'Tumpat',
  'Tanah Merah',
  'Machang',
  'Pasir Puteh',
  'Kuala Krai',
  'Gua Musang',
  'Jeli'
];

const TOPIC_OPTIONS_MS = [
  'Strategi Pemasaran Digital & TikTok Shop',
  'Pengurusan Aliran Tunai & Penyata Kewangan Kiosk',
  'Permohonan Pembiayaan TEKUN, MARA & Geran Negeri',
  'Penembusan Pasaran Eksport & Fesyen Batik Warisan',
  'Pensijilan Halal JAKIM & Piawaian Makanan MeSTI',
  'Rundingan Pembekal & Pengurusan Inventori'
];

const TOPIC_OPTIONS_EN = [
  'Digital Marketing Strategy & TikTok Shop',
  'Kiosk Cashflow & Financial Statement Management',
  'TEKUN, MARA & State Grant Applications',
  'Export Market Entry & Heritage Batik Branding',
  'Halal JAKIM & MeSTI Food Certification',
  'Supplier Negotiation & Inventory Control'
];

const DATE_SLOTS = [
  { date: '28 Mac 2026 (Sabtu)', time: '10:00 AM - 11:00 AM' },
  { date: '30 Mac 2026 (Isnin)', time: '11:30 AM - 12:30 PM' },
  { date: '2 April 2026 (Khamis)', time: '2:30 PM - 3:30 PM' },
  { date: '5 April 2026 (Ahad)', time: '10:00 AM - 11:00 AM' }
];

export const MentorshipPage: React.FC<MentorshipPageProps> = ({
  mentors,
  registrations,
  onBookMentorship,
  onCancelMentorship,
  defaultEntrepreneurName,
  defaultEntrepreneurEmail,
  defaultBusinessName,
  defaultPhone = '',
  defaultDistrict = 'Kota Bharu'
}) => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const bookingSectionRef = useRef<HTMLDivElement | null>(null);

  // Mentor filtering & selection
  const [searchQuery, setSearchQuery] = useState('');
  const [agencyFilter, setAgencyFilter] = useState<'all' | 'umk' | 'insken' | 'industry'>('all');
  const [selectedMentor, setSelectedMentor] = useState<MentorProfile | null>(null);
  const [brokenAvatarIds, setBrokenAvatarIds] = useState<Record<string, boolean>>({});

  // Inline 2-step cancel confirmation (no pop-up modal)
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);

  // Booking form state
  const [entrepreneurName, setEntrepreneurName] = useState(defaultEntrepreneurName);
  const [businessName, setBusinessName] = useState(defaultBusinessName);
  const [entrepreneurPhone, setEntrepreneurPhone] = useState(defaultPhone);
  const [district, setDistrict] = useState<KelantanDistrict>(defaultDistrict);
  const [topic, setTopic] = useState(isEn ? TOPIC_OPTIONS_EN[0] : TOPIC_OPTIONS_MS[0]);
  const [challenges, setChallenges] = useState('');
  const [selectedSlotIdx, setSelectedSlotIdx] = useState(0);
  const [mode, setMode] = useState<'Bersemuka di Kampus' | 'Google Meet Maya'>('Bersemuka di Kampus');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultEntrepreneurName && entrepreneurName === 'Usahawan Belia') {
      setEntrepreneurName(defaultEntrepreneurName);
    }
    if (defaultBusinessName && businessName === 'Perniagaan Anda') {
      setBusinessName(defaultBusinessName);
    }
    if (defaultPhone && !entrepreneurPhone) {
      setEntrepreneurPhone(defaultPhone);
    }
    if (defaultDistrict) {
      setDistrict(defaultDistrict);
    }
  }, [defaultEntrepreneurName, defaultBusinessName, defaultPhone, defaultDistrict]);

  // Derive sorted registrations, single active appointment, and history
  const sortedRegistrations = useMemo(() => {
    return [...registrations].sort((a, b) => {
      const ta = new Date(a.createdAt || 0).getTime();
      const tb = new Date(b.createdAt || 0).getTime();
      return tb - ta;
    });
  }, [registrations]);

  const activeSession = useMemo(() => {
    return sortedRegistrations.find((r) => r.status === 'pending' || r.status === 'confirmed') || null;
  }, [sortedRegistrations]);

  const hasActiveSession = Boolean(activeSession);

  const sessionHistory = useMemo(() => {
    return sortedRegistrations.filter((r) => r.status === 'completed' || r.status === 'cancelled');
  }, [sortedRegistrations]);

  const filteredMentors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return mentors.filter((m) => {
      const agencyText = m.agency.toLowerCase();
      const matchesAgency =
        agencyFilter === 'all' ||
        (agencyFilter === 'umk' && agencyText.includes('umk')) ||
        (agencyFilter === 'insken' && agencyText.includes('insken')) ||
        (agencyFilter === 'industry' && !agencyText.includes('umk') && !agencyText.includes('insken'));

      if (!matchesAgency) return false;
      if (!q) return true;

      return (
        m.name.toLowerCase().includes(q) ||
        m.title.toLowerCase().includes(q) ||
        m.agency.toLowerCase().includes(q) ||
        m.bio.toLowerCase().includes(q) ||
        m.expertise.some((exp) => exp.toLowerCase().includes(q))
      );
    });
  }, [mentors, searchQuery, agencyFilter]);

  const handleSelectMentor = (mentor: MentorProfile) => {
    if (hasActiveSession) return;
    setSelectedMentor(mentor);
    setValidationError(null);
    setTimeout(() => {
      bookingSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (hasActiveSession) {
      setValidationError(
        isEn
          ? 'You already have an active appointment. Please cancel it first before booking another mentor.'
          : 'Anda sudah mempunyai satu temu janji aktif. Sila batalkan sesi aktif terlebih dahulu.'
      );
      return;
    }

    if (!selectedMentor) return;

    if (!entrepreneurName.trim() || !businessName.trim() || !entrepreneurPhone.trim()) {
      setValidationError(
        isEn
          ? 'Please fill in your full name, business name, and WhatsApp phone number.'
          : 'Sila lengkapkan nama penuh, nama perniagaan, dan nombor WhatsApp anda.'
      );
      return;
    }

    const chosenSlot = DATE_SLOTS[selectedSlotIdx] || DATE_SLOTS[0];

    const newRegistration: MentorshipRegistration = {
      id: `mentee-reg-${Date.now()}`,
      mentorId: selectedMentor.id,
      mentorName: selectedMentor.name,
      entrepreneurName: entrepreneurName.trim(),
      entrepreneurPhone: entrepreneurPhone.trim(),
      entrepreneurEmail: defaultEntrepreneurEmail || 'usahawan@kbelia.my',
      businessName: businessName.trim(),
      district,
      businessCategory: 'Usahawan Belia Kelantan',
      topic,
      challenges:
        challenges.trim() ||
        (isEn
          ? 'Seeking practical guidance on operations, pricing, and customer growth.'
          : 'Memerlukan bimbingan praktikal operasi, penetapan harga, dan pemasaran.'),
      preferredDate: chosenSlot.date,
      preferredTime: chosenSlot.time,
      mode,
      status: 'pending',
      notes: 'Permohonan baharu melalui Halaman Bimbingan Mentor.',
      createdAt: new Date().toISOString()
    };

    const accepted = onBookMentorship(newRegistration);
    if (accepted !== false) {
      setSelectedMentor(null);
      setChallenges('');
      setIsConfirmingCancel(false);
    }
  };

  const handleConfirmCancel = () => {
    if (!activeSession) return;
    onCancelMentorship({ ...activeSession, status: 'cancelled' });
    setIsConfirmingCancel(false);
  };

  const getStatusMeta = (status: MentorshipRegistration['status']) => {
    switch (status) {
      case 'confirmed':
        return {
          label: isEn ? 'Confirmed' : 'Disahkan',
          className:
            'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
          icon: CheckCircle2
        };
      case 'pending':
        return {
          label: isEn ? 'Pending Mentor Confirmation' : 'Menunggu Pengesahan Mentor',
          className:
            'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700',
          icon: Clock
        };
      case 'completed':
        return {
          label: isEn ? 'Completed' : 'Selesai',
          className:
            'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700',
          icon: UserCheck
        };
      default:
        return {
          label: isEn ? 'Cancelled' : 'Dibatalkan',
          className:
            'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700',
          icon: XCircle
        };
    }
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .filter((part) => /^[A-Za-z]/.test(part))
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('');

  return (
    <div className="space-y-6">
      {/* Page Intro Header */}
      <div className="kbelia-important-header p-5 sm:p-6 rounded-2xl border border-slate-300 dark:border-zinc-600 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/75">
            <GraduationCap className="w-4 h-4" />
            <span>{isEn ? '1-on-1 Advisory & Coaching' : 'Bimbingan 1-ke-1 Usahawan'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-black dark:text-white tracking-tight text-balance">
            {isEn ? 'Mentor Advisory & Appointment Hub' : 'Halaman Bimbingan & Temu Janji Mentor'}
          </h1>
          <p className="text-xs sm:text-sm text-black/80 dark:text-white/80 leading-relaxed">
            {isEn
              ? 'Choose one certified UMK or agency mentor at a time to schedule your 1-on-1 advisory session.'
              : 'Pilih seorang mentor bertauliah UMK atau agensi pada satu masa untuk menempah sesi bimbingan.'}
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs shrink-0 pt-2 lg:pt-0">
          <div className="px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-600">
            <div className="text-[11px] font-semibold text-black/65 dark:text-white/70">
              {isEn ? 'Available Mentors' : 'Mentor Tersedia'}
            </div>
            <div className="text-base font-black text-black dark:text-white tabular-nums">
              {mentors.length}
            </div>
          </div>
          <div className="px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-600">
            <div className="text-[11px] font-semibold text-black/65 dark:text-white/70">
              {isEn ? 'Active Limit' : 'Had Aktif'}
            </div>
            <div className="text-base font-black text-black dark:text-white tabular-nums">
              {hasActiveSession ? '1 / 1' : '0 / 1'}
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* SECTION 1 (TOP): ACTIVE APPOINTMENT MANAGEMENT CARD               */}
      {/* ================================================================= */}
      <section aria-labelledby="active-appointment-heading">
        <div className="rounded-2xl border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-slate-300 dark:border-zinc-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2
                id="active-appointment-heading"
                className="text-sm sm:text-base font-extrabold text-black dark:text-white"
              >
                {isEn ? 'Your Active Mentorship Appointment' : 'Temu Janji Bimbingan Aktif Anda'}
              </h2>
              <p className="text-xs text-black/70 dark:text-white/75">
                {isEn
                  ? 'Only 1 active appointment is allowed per account at a time.'
                  : 'Hanya 1 temu janji aktif dibenarkan bagi setiap akaun dalam satu masa.'}
              </p>
            </div>

            {activeSession && (() => {
              const meta = getStatusMeta(activeSession.status);
              const StatusIcon = meta.icon;
              return (
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold self-start sm:self-auto ${meta.className}`}
                >
                  <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>{meta.label}</span>
                </span>
              );
            })()}
          </div>

          {activeSession ? (
            <div className="p-5 sm:p-6 space-y-5">
              {/* Primary Appointment Details */}
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                <div className="space-y-3 flex-1 min-w-0">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-black/60 dark:text-white/65">
                      {isEn ? 'Assigned Mentor' : 'Mentor Pilihan'}
                    </div>
                    <h3 className="text-lg font-black text-black dark:text-white mt-0.5">
                      {activeSession.mentorName}
                    </h3>
                    <p className="text-xs font-semibold text-black/75 dark:text-white/75 mt-0.5">
                      {activeSession.topic}
                    </p>
                  </div>

                  {/* Clean Metadata Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-200 dark:border-zinc-700 text-xs">
                    <div>
                      <div className="text-black/60 dark:text-white/65 font-medium flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{isEn ? 'Date & Time' : 'Tarikh & Masa'}</span>
                      </div>
                      <div className="font-bold text-black dark:text-white mt-1 tabular-nums">
                        {activeSession.preferredDate}
                      </div>
                      <div className="text-black/75 dark:text-white/75 tabular-nums">
                        {activeSession.preferredTime}
                      </div>
                    </div>

                    <div>
                      <div className="text-black/60 dark:text-white/65 font-medium flex items-center gap-1.5">
                        {activeSession.mode === 'Google Meet Maya' ? (
                          <Video className="w-3.5 h-3.5" />
                        ) : (
                          <MapPin className="w-3.5 h-3.5" />
                        )}
                        <span>{isEn ? 'Session Mode' : 'Mod Sesi'}</span>
                      </div>
                      <div className="font-bold text-black dark:text-white mt-1">
                        {activeSession.mode}
                      </div>
                      <div className="text-black/75 dark:text-white/75">
                        {activeSession.district}
                      </div>
                    </div>

                    <div>
                      <div className="text-black/60 dark:text-white/65 font-medium flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        <span>{isEn ? 'Registered Business' : 'Perniagaan Berdaftar'}</span>
                      </div>
                      <div className="font-bold text-black dark:text-white mt-1">
                        {activeSession.businessName}
                      </div>
                      <div className="text-black/75 dark:text-white/75 tabular-nums">
                        {activeSession.entrepreneurPhone}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mentor Notes / Action Plan / Meeting Link */}
              {(activeSession.meetingLink || activeSession.mentorActionPlan || activeSession.notes) && (
                <div className="pt-4 border-t border-slate-200 dark:border-zinc-700 space-y-2.5 text-xs">
                  {activeSession.meetingLink && (
                    <div className="flex flex-wrap items-center justify-between gap-3 py-2">
                      <div>
                        <span className="font-bold text-black dark:text-white">
                          {isEn ? 'Online Session Link:' : 'Pautan Sesi Atas Talian:'}{' '}
                        </span>
                        <span className="text-black/75 dark:text-white/75 break-all">
                          {activeSession.meetingLink}
                        </span>
                      </div>
                      <a
                        href={activeSession.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition-colors whitespace-nowrap shrink-0"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>{isEn ? 'Join Google Meet' : 'Sertai Google Meet'}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}

                  {activeSession.mentorActionPlan && (
                    <div className="text-black dark:text-white whitespace-pre-line leading-relaxed">
                      <span className="font-bold block mb-1">
                        {isEn ? 'Mentor Action Plan:' : 'Pelan Tindakan Mentor:'}
                      </span>
                      {activeSession.mentorActionPlan}
                    </div>
                  )}

                  {activeSession.notes && !activeSession.mentorActionPlan && (
                    <div className="text-black/75 dark:text-white/75 leading-relaxed">
                      <span className="font-bold text-black dark:text-white">
                        {isEn ? 'Note:' : 'Catatan:'}{' '}
                      </span>
                      {activeSession.notes}
                    </div>
                  )}
                </div>
              )}

              {/* Action Bar with Inline 2-Step Cancel Confirmation */}
              <div className="pt-4 border-t border-slate-200 dark:border-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-black/75 dark:text-white/75">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {isEn
                      ? 'To choose another mentor, cancel this appointment first.'
                      : 'Untuk memilih mentor lain, sila batalkan temu janji ini terlebih dahulu.'}
                  </span>
                </div>

                {!isConfirmingCancel ? (
                  <button
                    type="button"
                    onClick={() => setIsConfirmingCancel(true)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-950/80 text-rose-800 dark:text-rose-200 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>{isEn ? 'Cancel Appointment' : 'Batalkan Temu Janji'}</span>
                  </button>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                      {isEn ? 'Confirm cancellation?' : 'Sahkan pembatalan?'}
                    </span>
                    <button
                      type="button"
                      onClick={handleConfirmCancel}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {isEn ? 'Yes, Cancel' : 'Ya, Batalkan'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingCancel(false)}
                      className="px-4 py-2 rounded-xl border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-black dark:text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {isEn ? 'Keep Session' : 'Kekalkan'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-black dark:text-white">
                    {isEn ? 'No Active Appointment' : 'Tiada Temu Janji Aktif'}
                  </h3>
                  <p className="text-xs text-black/75 dark:text-white/75 mt-0.5 leading-relaxed">
                    {isEn
                      ? 'Select one mentor from the directory below to book your 1-on-1 coaching session.'
                      : 'Pilih seorang mentor daripada senarai di bawah untuk menempah sesi bimbingan 1-ke-1 anda.'}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1.5 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
                <span>{isEn ? 'Slot Ready to Book' : 'Sedia Untuk Ditempah'}</span>
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ================================================================= */}
      {/* SECTION 2: INLINE BOOKING WORKSPACE (WHEN MENTOR SELECTED)        */}
      {/* ================================================================= */}
      {selectedMentor && !hasActiveSession && (
        <section
          ref={bookingSectionRef}
          aria-labelledby="inline-booking-heading"
          className="rounded-2xl border border-teal-400 dark:border-teal-600 bg-white dark:bg-zinc-900 overflow-hidden"
        >
          <div className="px-5 sm:px-6 py-4 border-b border-slate-300 dark:border-zinc-600 bg-teal-50/70 dark:bg-teal-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h2
                  id="inline-booking-heading"
                  className="text-sm sm:text-base font-extrabold text-black dark:text-white"
                >
                  {isEn ? `Book Session with ${selectedMentor.name}` : `Borang Temu Janji: ${selectedMentor.name}`}
                </h2>
                <p className="text-xs text-black/75 dark:text-white/75">
                  {selectedMentor.agency} &middot; {selectedMentor.availableDays}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedMentor(null);
                setValidationError(null);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-black dark:text-white text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto whitespace-nowrap shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              <span>{isEn ? 'Change Mentor' : 'Tukar Mentor'}</span>
            </button>
          </div>

          <form onSubmit={handleSubmitBooking} className="p-5 sm:p-6 space-y-5">
            {validationError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-700 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-black dark:text-white mb-1.5">
                  {isEn ? 'Full Name' : 'Nama Penuh Usahawan'} *
                </label>
                <input
                  type="text"
                  required
                  value={entrepreneurName}
                  onChange={(e) => setEntrepreneurName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 text-black dark:text-white focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-black dark:text-white mb-1.5">
                  {isEn ? 'WhatsApp Number' : 'Nombor WhatsApp'} *
                </label>
                <input
                  type="text"
                  required
                  value={entrepreneurPhone}
                  onChange={(e) => setEntrepreneurPhone(e.target.value)}
                  placeholder="60123456789"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-mono bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 text-black dark:text-white focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-black dark:text-white mb-1.5">
                  {isEn ? 'Business / Kiosk Name' : 'Nama Perniagaan / Kiosk'} *
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 text-black dark:text-white focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-black dark:text-white mb-1.5">
                  {isEn ? 'District' : 'Jajahan'} *
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value as KelantanDistrict)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 text-black dark:text-white focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 cursor-pointer"
                >
                  {KELANTAN_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-black dark:text-white mb-1.5">
                  {isEn ? 'Primary Topic' : 'Topik Utama Bimbingan'} *
                </label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 text-black dark:text-white focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 cursor-pointer"
                >
                  {(isEn ? TOPIC_OPTIONS_EN : TOPIC_OPTIONS_MS).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-black dark:text-white mb-1.5">
                  {isEn ? 'Preferred Slot' : 'Pilihan Tarikh & Masa'} *
                </label>
                <select
                  value={selectedSlotIdx}
                  onChange={(e) => setSelectedSlotIdx(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 text-black dark:text-white focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 cursor-pointer"
                >
                  {DATE_SLOTS.map((slot, idx) => (
                    <option key={slot.date} value={idx}>
                      {slot.date} ({slot.time})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-black dark:text-white mb-1.5">
                  {isEn ? 'Session Mode' : 'Mod Sesi'} *
                </label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as 'Bersemuka di Kampus' | 'Google Meet Maya')}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 text-black dark:text-white focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 cursor-pointer"
                >
                  <option value="Bersemuka di Kampus">
                    {isEn ? 'In-Person (UMK Campus)' : 'Bersemuka di Kampus UMK'}
                  </option>
                  <option value="Google Meet Maya">
                    {isEn ? 'Google Meet (Online)' : 'Google Meet Maya (Atas Talian)'}
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-black dark:text-white mb-1.5">
                {isEn ? 'Key Questions or Challenges' : 'Ringkasan Soalan atau Cabaran'}
              </label>
              <textarea
                rows={2}
                value={challenges}
                onChange={(e) => setChallenges(e.target.value)}
                placeholder={
                  isEn
                    ? 'Briefly describe what you want to discuss during the session...'
                    : 'Nyatakan perkara atau soalan yang ingin dibincangkan bersama mentor...'
                }
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => {
                  setSelectedMentor(null);
                  setValidationError(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-black dark:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                {isEn ? 'Cancel' : 'Batal'}
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isEn ? 'Confirm & Book Appointment' : 'Sahkan & Tempah Temu Janji'}</span>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ================================================================= */}
      {/* SECTION 3 (BOTTOM): MENTOR DIRECTORY LIST                         */}
      {/* ================================================================= */}
      <section aria-labelledby="mentor-list-heading" className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2
              id="mentor-list-heading"
              className="text-base sm:text-lg font-extrabold text-black dark:text-white"
            >
              {isEn ? 'Certified Mentor Directory' : 'Senarai Mentor Bertauliah'}
            </h2>
            <p className="text-xs text-black/70 dark:text-white/75">
              {isEn
                ? 'Select a mentor matching your business sector and advisory needs.'
                : 'Pilih mentor yang sepadan dengan bidang dan keperluan bimbingan anda.'}
            </p>
          </div>

          {/* Search + Agency Filter Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-black/60 dark:text-white/65 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isEn ? 'Search mentor or expertise...' : 'Cari nama mentor atau kepakaran...'}
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-600 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-600 overflow-x-auto">
              {(
                [
                  { id: 'all', label: isEn ? 'All' : 'Semua' },
                  { id: 'umk', label: 'UMK' },
                  { id: 'insken', label: 'INSKEN' },
                  { id: 'industry', label: isEn ? 'Industry' : 'Industri' }
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setAgencyFilter(tab.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    agencyFilter === tab.id
                      ? 'bg-white dark:bg-zinc-900 text-black dark:text-white shadow-xs'
                      : 'text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active Lock Notice */}
        {hasActiveSession && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 flex items-start sm:items-center gap-3 text-xs text-black dark:text-white">
            <Lock className="w-4 h-4 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5 sm:mt-0" />
            <span>
              {isEn
                ? 'Mentor selection is locked while you have an active appointment. Cancel your active session above to select another mentor.'
                : 'Pemilihan mentor lain dikunci sementara anda mempunyai temu janji aktif. Sila batalkan temu janji aktif di atas terlebih dahulu untuk memilih mentor baharu.'}
            </span>
          </div>
        )}

        {/* Mentor Cards Grid */}
        {filteredMentors.length === 0 ? (
          <div className="p-8 rounded-2xl border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-center space-y-2">
            <p className="text-sm font-bold text-black dark:text-white">
              {isEn ? 'No Matching Mentors Found' : 'Tiada Mentor Ditemui'}
            </p>
            <p className="text-xs text-black/70 dark:text-white/75">
              {isEn
                ? 'Try clearing your search keyword or changing the agency filter.'
                : 'Cuba tukar kata carian atau pilih penapis agensi lain.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setAgencyFilter('all');
              }}
              className="mt-2 px-4 py-2 rounded-xl border border-slate-300 dark:border-zinc-600 text-xs font-bold text-black dark:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              {isEn ? 'Reset Filters' : 'Set Semula Penapis'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredMentors.map((mentor) => {
              const isCurrentBookedMentor = activeSession?.mentorId === mentor.id;
              const isSelectedForForm = selectedMentor?.id === mentor.id && !hasActiveSession;
              const showFallbackAvatar = !mentor.avatarUrl || brokenAvatarIds[mentor.id];

              return (
                <div
                  key={mentor.id}
                  className={`p-5 rounded-2xl border bg-white dark:bg-zinc-900 flex flex-col justify-between gap-4 transition-colors ${
                    isCurrentBookedMentor || isSelectedForForm
                      ? 'border-teal-500 dark:border-teal-500'
                      : 'border-slate-300 dark:border-zinc-600'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start gap-3.5">
                      {!showFallbackAvatar ? (
                        <img
                          src={mentor.avatarUrl}
                          alt={mentor.name}
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setBrokenAvatarIds((prev) => ({ ...prev, [mentor.id]: true }))
                          }
                          className="w-12 h-12 rounded-xl object-cover border border-slate-300 dark:border-zinc-600 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-600 flex items-center justify-center text-sm font-black text-black dark:text-white shrink-0">
                          {getInitials(mentor.name)}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-semibold text-black/65 dark:text-white/70 truncate">
                          {mentor.agency}
                        </div>
                        <h3 className="text-sm sm:text-base font-extrabold text-black dark:text-white leading-snug">
                          {mentor.name}
                        </h3>
                        <p className="text-xs text-black/75 dark:text-white/75 mt-0.5 leading-snug">
                          {mentor.title}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-black/80 dark:text-white/80 leading-relaxed">
                      {mentor.bio}
                    </p>

                    <div className="pt-2 border-t border-slate-200 dark:border-zinc-700 space-y-1.5 text-xs">
                      <div className="text-black/75 dark:text-white/75 flex items-center gap-1.5 tabular-nums">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>{mentor.availableDays}</span>
                      </div>
                      <div className="text-black/70 dark:text-white/70 leading-relaxed">
                        <span className="font-semibold text-black dark:text-white">
                          {isEn ? 'Expertise: ' : 'Kepakaran: '}
                        </span>
                        {mentor.expertise.join(' · ')}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-zinc-700 flex items-center justify-between gap-3">
                    <span className="text-[11px] font-medium text-black/65 dark:text-white/65 tabular-nums">
                      {isEn
                        ? `${mentor.activeMenteesCount ?? 0} active mentees`
                        : `${mentor.activeMenteesCount ?? 0} usahawan dibimbing`}
                    </span>

                    {isCurrentBookedMentor ? (
                      <button
                        type="button"
                        disabled
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs font-bold cursor-not-allowed whitespace-nowrap shrink-0"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isEn ? 'Active Mentor' : 'Mentor Aktif Anda'}</span>
                      </button>
                    ) : hasActiveSession ? (
                      <button
                        type="button"
                        disabled
                        aria-disabled="true"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-600 text-black/50 dark:text-white/50 text-xs font-bold cursor-not-allowed whitespace-nowrap shrink-0"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>{isEn ? 'Locked (1 Active Limit)' : 'Dikunci (Had 1 Sesi)'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSelectMentor(mentor)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          isSelectedForForm
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-black'
                            : 'bg-teal-600 hover:bg-teal-700 text-white'
                        }`}
                      >
                        <span>
                          {isSelectedForForm
                            ? isEn
                              ? 'Selected Below Form'
                              : 'Sedang Dipilih'
                            : isEn
                            ? 'Select Mentor'
                            : 'Pilih Mentor'}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ================================================================= */}
      {/* SECTION 4: SESSION HISTORY (COMPLETED & CANCELLED)                */}
      {/* ================================================================= */}
      <section aria-labelledby="session-history-heading" className="pt-2">
        <div className="rounded-2xl border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-slate-300 dark:border-zinc-600 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-black/75 dark:text-white/75" />
              <h2
                id="session-history-heading"
                className="text-sm sm:text-base font-extrabold text-black dark:text-white"
              >
                {isEn ? 'Session History' : 'Sejarah Sesi Bimbingan'}
              </h2>
            </div>
            <span className="text-xs font-bold text-black/65 dark:text-white/70 tabular-nums">
              {sessionHistory.length} {isEn ? 'records' : 'rekod'}
            </span>
          </div>

          {sessionHistory.length === 0 ? (
            <div className="p-6 text-center text-xs text-black/70 dark:text-white/75">
              {isEn
                ? 'Completed or cancelled mentorship sessions will appear here.'
                : 'Rekod sesi bimbingan yang telah selesai atau dibatalkan akan dipaparkan di sini.'}
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-zinc-700">
              {sessionHistory.map((item) => {
                const meta = getStatusMeta(item.status);
                const StatusIcon = meta.icon;
                return (
                  <div
                    key={item.id}
                    className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-bold text-black dark:text-white">
                          {item.mentorName}
                        </span>
                        <span aria-hidden="true" className="text-black/40 dark:text-white/40">
                          &middot;
                        </span>
                        <span className="text-black/75 dark:text-white/75 tabular-nums">
                          {item.preferredDate} ({item.preferredTime})
                        </span>
                        <span aria-hidden="true" className="text-black/40 dark:text-white/40">
                          &middot;
                        </span>
                        <span className="text-black/70 dark:text-white/70">{item.mode}</span>
                      </div>
                      <p className="text-xs text-black/80 dark:text-white/80 truncate">
                        {item.topic}
                      </p>
                      {item.mentorActionPlan && (
                        <p className="text-[11px] text-black/65 dark:text-white/70 whitespace-pre-line pt-1">
                          {item.mentorActionPlan}
                        </p>
                      )}
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold self-start sm:self-center whitespace-nowrap shrink-0 ${meta.className}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>{meta.label}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
