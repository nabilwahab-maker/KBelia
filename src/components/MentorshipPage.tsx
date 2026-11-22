import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Lock,
  MapPin,
  Video,
  Send,
  ExternalLink,
  AlertCircle,
  History,
  UserCheck,
  ChevronRight,
  Users,
  X,
  FileText
} from 'lucide-react';
import { KelantanDistrict, MentorProfile, MentorshipRegistration, PublishedMentorSlot, normalizeMentorshipMode } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { usePrefersReducedMotion } from '../hooks/useMotion';
import { ModernDatePicker, ModernTimePicker, toLocalIsoDate } from './ModernDateTimePicker';
import { PaginationBar, usePagination } from './PaginationBar';
import { ReferenceTableToolbar } from './ReferenceTableKit';

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
  'Strategi Pemasaran Digital & E-Dagang',
  'Pengurusan Aliran Tunai & Penyata Kewangan Kiosk',
  'Permohonan Pembiayaan Mikro & Geran Digital',
  'Penembusan Pasaran Eksport & Fesyen Batik Warisan',
  'Pensijilan Halal & Piawaian Keselamatan Makanan',
  'Rundingan Pembekal & Pengurusan Inventori'
];

const TOPIC_OPTIONS_EN = [
  'Digital Marketing & E-Commerce Strategy',
  'Kiosk Cashflow & Financial Statement Management',
  'Micro-Financing & Digital Grant Applications',
  'Export Market Entry & Heritage Batik Branding',
  'Halal & Food Safety Certification Standards',
  'Supplier Negotiation & Inventory Control'
];

const DEFAULT_SLOT_TIMES = [
  '10:00 AM - 11:00 AM',
  '11:30 AM - 12:30 PM',
  '2:30 PM - 3:30 PM',
  '10:00 AM - 11:00 AM'
];

const generateUpcomingDateSlots = (isEn: boolean): { date: string; time: string }[] => {
  const daysMs = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
  const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthsMs = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'];
  const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const results: { date: string; time: string }[] = [];
  const cursor = new Date();
  let safety = 0;

  while (results.length < 4 && safety < 21) {
    cursor.setDate(cursor.getDate() + 1);
    safety += 1;
    // Skip Friday (Kelantan weekend) when auto-generating standard slots
    if (cursor.getDay() === 5) continue;
    const dayName = isEn ? daysEn[cursor.getDay()] : daysMs[cursor.getDay()];
    const monthName = isEn ? monthsEn[cursor.getMonth()] : monthsMs[cursor.getMonth()];
    const dateLabel = `${cursor.getDate()} ${monthName} ${cursor.getFullYear()} (${dayName})`;
    results.push({
      date: dateLabel,
      time: DEFAULT_SLOT_TIMES[results.length] || '10:00 AM - 11:00 AM'
    });
  }
  return results;
};

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
  const prefersReducedMotion = usePrefersReducedMotion();

  const bookingSectionRef = useRef<HTMLDivElement | null>(null);

  // Mentor filtering, spotlight rotation & selection
  const [searchQuery, setSearchQuery] = useState('');
  const [agencyFilter, setAgencyFilter] = useState<'all' | 'internal' | 'industry'>('all');
  const [expertiseFilter, setExpertiseFilter] = useState<string>('all');
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [isSpotlightHovered, setIsSpotlightHovered] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<MentorProfile | null>(null);
  const [detailMentor, setDetailMentor] = useState<MentorProfile | null>(null);
  const [appointmentTab, setAppointmentTab] = useState<'active' | 'history'>('active');
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
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('10:00 AM - 11:00 AM');
  const [mode, setMode] = useState<'Bersemuka di Kampus' | 'Google Meet'>('Bersemuka di Kampus');
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

  const availableDateSlots = useMemo(() => {
    const generated = generateUpcomingDateSlots(isEn);
    if (!selectedMentor) return generated;

    let localPublished: PublishedMentorSlot[] = [];
    try {
      const raw = localStorage.getItem(`kbelia_mentor_published_slots_${selectedMentor.id}`);
      if (raw) localPublished = JSON.parse(raw);
    } catch {
      // ignore
    }

    const customSlots = [
      ...(selectedMentor.publishedSlots || []),
      ...localPublished
    ].map(s => ({ date: s.date, time: s.time }));

    const combined = [...customSlots, ...generated];
    return combined.filter((slot, idx, arr) =>
      arr.findIndex(s => s.date === slot.date && s.time === slot.time) === idx
    );
  }, [selectedMentor, isEn]);

  useEffect(() => {
    const firstSlot = availableDateSlots[0];
    if (firstSlot) {
      setPreferredDate(firstSlot.date);
      setPreferredTime(firstSlot.time);
    }
  }, [selectedMentor?.id, availableDateSlots]);

  const todayIso = useMemo(() => toLocalIsoDate(new Date()), []);

  const quickMentorDates = useMemo(() => {
    const seen = new Set<string>();
    return availableDateSlots
      .filter((s) => {
        if (seen.has(s.date)) return false;
        seen.add(s.date);
        return true;
      })
      .slice(0, 4)
      .map((s) => ({ label: s.date, value: s.date }));
  }, [availableDateSlots]);

  const quickMentorTimes = useMemo(() => {
    const seen = new Set<string>();
    const list: { label: string; value: string }[] = [];
    availableDateSlots.forEach((s) => {
      if (!seen.has(s.time)) {
        seen.add(s.time);
        list.push({ label: s.time, value: s.time });
      }
    });
    if (list.length === 0) {
      return DEFAULT_SLOT_TIMES.slice(0, 3).map((t) => ({ label: t, value: t }));
    }
    return list;
  }, [availableDateSlots]);

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

  const availableExpertiseOptions = useMemo(() => {
    const unique = new Set<string>();
    mentors.forEach((m) => {
      (m.expertise || []).forEach((exp) => {
        const trimmed = exp.trim();
        if (trimmed) unique.add(trimmed);
      });
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [mentors]);

  const filteredMentors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return mentors.filter((m) => {
      const agencyText = m.agency.toLowerCase();
      const isInternalMentor =
        agencyText.includes('dalaman') ||
        agencyText.includes('internal') ||
        agencyText.includes('hab usahawan') ||
        agencyText.includes('umk');
      const matchesAgency =
        agencyFilter === 'all' ||
        (agencyFilter === 'internal' && isInternalMentor) ||
        (agencyFilter === 'industry' && !isInternalMentor);

      if (!matchesAgency) return false;

      const matchesExpertise =
        expertiseFilter === 'all' || (m.expertise || []).some((exp) => exp.trim() === expertiseFilter);

      if (!matchesExpertise) return false;
      if (!q) return true;

      return (
        m.name.toLowerCase().includes(q) ||
        m.title.toLowerCase().includes(q) ||
        m.agency.toLowerCase().includes(q) ||
        m.bio.toLowerCase().includes(q) ||
        m.expertise.some((exp) => exp.toLowerCase().includes(q))
      );
    });
  }, [mentors, searchQuery, agencyFilter, expertiseFilter]);

  const activeFilterCount =
    (agencyFilter !== 'all' ? 1 : 0) + (expertiseFilter !== 'all' ? 1 : 0);

  const mentorPagination = usePagination(filteredMentors, 6, [
    searchQuery,
    agencyFilter,
    expertiseFilter,
    filteredMentors.length
  ]);

  const historyPagination = usePagination(sessionHistory, 3, [sessionHistory.length]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setAgencyFilter('all');
    setExpertiseFilter('all');
  };

  useEffect(() => {
    setSpotlightIndex(0);
  }, [searchQuery, agencyFilter, expertiseFilter, filteredMentors.length]);

  useEffect(() => {
    if (!detailMentor) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDetailMentor(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [detailMentor]);

  useEffect(() => {
    if (
      prefersReducedMotion ||
      isSpotlightHovered ||
      detailMentor ||
      filteredMentors.length <= 1
    ) {
      return;
    }
    const timer = window.setInterval(() => {
      setSpotlightIndex((prev) => (prev + 1) % filteredMentors.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [prefersReducedMotion, isSpotlightHovered, detailMentor, filteredMentors.length]);

  const safeSpotlightIndex =
    filteredMentors.length > 0 ? spotlightIndex % filteredMentors.length : 0;
  const spotlightMentor = filteredMentors[safeSpotlightIndex] || null;

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
          ? 'Please fill in your full name, business name, and phone number.'
          : 'Sila lengkapkan nama penuh, nama perniagaan, dan nombor telefon anda.'
      );
      return;
    }

    const fallbackSlot = availableDateSlots[0];
    const finalDate = preferredDate.trim() || fallbackSlot?.date || '';
    const finalTime = preferredTime.trim() || fallbackSlot?.time || '10:00 AM - 11:00 AM';

    if (!finalDate || !finalTime) {
      setValidationError(
        isEn
          ? 'Please select both session date and time.'
          : 'Sila pilih tarikh dan masa sesi bimbingan anda.'
      );
      return;
    }

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
      preferredDate: finalDate,
      preferredTime: finalTime,
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
      setAppointmentTab('active');
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
            'bg-emerald-50 dark:bg-emerald-950/60 text-black dark:text-white border-emerald-300 dark:border-emerald-700',
          icon: CheckCircle2
        };
      case 'pending':
        return {
          label: isEn ? 'Pending Mentor Confirmation' : 'Menunggu Pengesahan Mentor',
          className:
            'bg-amber-50 dark:bg-amber-950/60 text-black dark:text-white border-amber-300 dark:border-amber-700',
          icon: Clock
        };
      case 'completed':
        return {
          label: isEn ? 'Completed' : 'Selesai',
          className:
            'bg-blue-50 dark:bg-blue-950/60 text-black dark:text-white border-blue-300 dark:border-blue-700',
          icon: UserCheck
        };
      default:
        return {
          label: isEn ? 'Cancelled' : 'Dibatalkan',
          className:
            'bg-rose-50 dark:bg-rose-950/60 text-black dark:text-white border-rose-300 dark:border-rose-700',
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
    <div className="w-full space-y-5">
      {/* Page Intro Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-black dark:text-white tracking-tight text-balance">
          {isEn ? 'Mentor Advisory & Appointments' : 'Bimbingan & Temu Janji Mentor'}
        </h1>
        <p className="text-sm text-black/65 dark:text-white/70 mt-1 max-w-2xl">
          {isEn
            ? 'Book one-on-one business coaching with Kelantan industry practitioners and university entrepreneurship advisors.'
            : 'Tempah sesi bimbingan perniagaan satu-ke-satu bersama pakar industri dan penasihat keusahawanan Kelantan.'}
        </p>
      </div>

      {/* ================================================================= */}
      {/* SECTION 1 (TOP): TABBED ACTIVE APPOINTMENT & SESSION HISTORY      */}
      {/* ================================================================= */}
      <section aria-label={isEn ? 'Mentorship Appointments' : 'Temu Janji Bimbingan'}>
        <div className="rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xs overflow-hidden">
          <div className="px-4 sm:px-5 pt-2 border-b border-slate-200 dark:border-zinc-700 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2" role="tablist" aria-label={isEn ? 'Appointment views' : 'Paparan temu janji'}>
              <button
                type="button"
                role="tab"
                aria-selected={appointmentTab === 'active'}
                onClick={() => setAppointmentTab('active')}
                className={`px-3 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  appointmentTab === 'active'
                    ? 'border-teal-600 dark:border-teal-400 text-teal-700 dark:text-teal-400'
                    : 'border-transparent text-black/60 dark:text-white/65 hover:text-black dark:hover:text-white'
                }`}
              >
                <span>{isEn ? 'Active Appointment' : 'Temu Janji Aktif'}</span>
                <span className="text-xs tabular-nums opacity-75">
                  {activeSession ? '1' : '0'}
                </span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={appointmentTab === 'history'}
                onClick={() => setAppointmentTab('history')}
                className={`px-3 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  appointmentTab === 'history'
                    ? 'border-teal-600 dark:border-teal-400 text-teal-700 dark:text-teal-400'
                    : 'border-transparent text-black/60 dark:text-white/65 hover:text-black dark:hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5 shrink-0" />
                <span>{isEn ? 'Session History' : 'Sejarah Sesi'}</span>
                <span className="text-xs tabular-nums opacity-75">
                  {sessionHistory.length}
                </span>
              </button>
            </div>

            {appointmentTab === 'active' && activeSession && (() => {
              const meta = getStatusMeta(activeSession.status);
              const StatusIcon = meta.icon;
              return (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-black/75 dark:text-white/80 whitespace-nowrap shrink-0 pb-1">
                  <StatusIcon className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span>{meta.label}</span>
                </span>
              );
            })()}
          </div>

          {appointmentTab === 'active' ? (
            activeSession ? (
              <div className="p-4 sm:p-5 space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                  <div className="lg:col-span-5 min-w-0">
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 block">
                      {isEn ? 'Assigned Mentor' : 'Mentor Pilihan'}
                    </span>
                    <h2 className="text-base sm:text-lg font-extrabold text-black dark:text-white truncate mt-0.5">
                      {activeSession.mentorName}
                    </h2>
                    <p className="text-sm text-black/70 dark:text-white/75 truncate">
                      {activeSession.topic}
                    </p>
                  </div>

                  <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-zinc-800">
                    <div>
                      <span className="text-xs font-medium text-black/55 dark:text-white/60 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{isEn ? 'Schedule' : 'Tarikh & Masa'}</span>
                      </span>
                      <div className="font-bold text-black dark:text-white tabular-nums mt-0.5">
                        {activeSession.preferredDate}
                      </div>
                      <div className="text-xs text-black/65 dark:text-white/70 tabular-nums">
                        {activeSession.preferredTime}
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-medium text-black/55 dark:text-white/60 flex items-center gap-1">
                        {normalizeMentorshipMode(activeSession.mode) === 'Google Meet' ? (
                          <Video className="w-3.5 h-3.5" />
                        ) : (
                          <MapPin className="w-3.5 h-3.5" />
                        )}
                        <span>{isEn ? 'Mode' : 'Mod Sesi'}</span>
                      </span>
                      <div className="font-bold text-black dark:text-white mt-0.5">
                        {normalizeMentorshipMode(activeSession.mode) === 'Google Meet'
                          ? 'Google Meet'
                          : isEn
                          ? 'In-Person Hub'
                          : 'Bersemuka di Hab'}
                      </div>
                      <div className="text-xs text-black/65 dark:text-white/70">
                        {activeSession.district}
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-medium text-black/55 dark:text-white/60 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        <span>{isEn ? 'Business' : 'Perniagaan'}</span>
                      </span>
                      <div className="font-bold text-black dark:text-white truncate mt-0.5">
                        {activeSession.businessName}
                      </div>
                      <div className="text-xs text-black/65 dark:text-white/70 tabular-nums">
                        {activeSession.entrepreneurPhone}
                      </div>
                    </div>
                  </div>
                </div>

                {(activeSession.meetingLink || activeSession.mentorActionPlan || activeSession.notes) && (
                  <div className="pt-3.5 border-t border-slate-100 dark:border-zinc-800 space-y-2 text-sm">
                    {activeSession.meetingLink && (
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <span className="font-bold text-black dark:text-white">
                            {isEn ? 'Meeting Link:' : 'Pautan Sesi:'}{' '}
                          </span>
                          <span className="text-black/70 dark:text-white/75 break-all">
                            {activeSession.meetingLink}
                          </span>
                        </div>
                        <a
                          href={activeSession.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>{isEn ? 'Join Google Meet' : 'Sertai Google Meet'}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}

                    {activeSession.mentorActionPlan && (
                      <div className="text-black/80 dark:text-white/85 whitespace-pre-line leading-relaxed">
                        <span className="font-bold text-black dark:text-white">
                          {isEn ? 'Mentor Action Plan:' : 'Pelan Tindakan Mentor:'}{' '}
                        </span>
                        {activeSession.mentorActionPlan}
                      </div>
                    )}

                    {activeSession.notes && !activeSession.mentorActionPlan && (
                      <div className="text-black/70 dark:text-white/75 leading-relaxed">
                        <span className="font-bold text-black dark:text-white">
                          {isEn ? 'Note:' : 'Catatan:'}{' '}
                        </span>
                        {activeSession.notes}
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-3.5 border-t border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-black/65 dark:text-white/70">
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {isEn
                        ? 'Cancel this active session first to book another mentor.'
                        : 'Batalkan sesi aktif ini dahulu untuk memilih mentor lain.'}
                    </span>
                  </div>

                  {!isConfirmingCancel ? (
                    <button
                      type="button"
                      onClick={() => setIsConfirmingCancel(true)}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-950/80 text-black dark:text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 self-end sm:self-auto"
                    >
                      <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      <span>{isEn ? 'Cancel Appointment' : 'Batalkan Temu Janji'}</span>
                    </button>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                      <span className="text-xs sm:text-sm font-bold text-black dark:text-white">
                        {isEn ? 'Confirm cancellation?' : 'Sahkan pembatalan?'}
                      </span>
                      <button
                        type="button"
                        onClick={handleConfirmCancel}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      >
                        {isEn ? 'Yes, Cancel' : 'Ya, Batalkan'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsConfirmingCancel(false)}
                        className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-black dark:text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      >
                        {isEn ? 'Keep' : 'Kekalkan'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-5 text-sm text-black/65 dark:text-white/70 flex flex-wrap items-center justify-between gap-3">
                <span>
                  {isEn
                    ? 'No active mentorship appointment right now. Choose any mentor below to book a session.'
                    : 'Tiada temu janji bimbingan aktif buat masa ini. Pilih mana-mana mentor di bawah untuk menempah sesi baharu.'}
                </span>
              </div>
            )
          ) : sessionHistory.length === 0 ? (
            <div className="p-6 text-center text-sm text-black/65 dark:text-white/70">
              {isEn
                ? 'Completed or cancelled mentorship sessions will appear here.'
                : 'Rekod sesi bimbingan yang telah selesai atau dibatalkan akan dipaparkan di sini.'}
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-200 dark:divide-zinc-700">
                {historyPagination.paginatedItems.map((item) => {
                  const meta = getStatusMeta(item.status);
                  const StatusIcon = meta.icon;
                  return (
                    <div
                      key={item.id}
                      className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="font-bold text-black dark:text-white">
                            {item.mentorName}
                          </span>
                          <span aria-hidden="true" className="text-black/35 dark:text-white/35">
                            ·
                          </span>
                          <span className="text-black/70 dark:text-white/75 tabular-nums">
                            {item.preferredDate} ({item.preferredTime})
                          </span>
                          <span aria-hidden="true" className="text-black/35 dark:text-white/35">
                            ·
                          </span>
                          <span className="text-black/65 dark:text-white/70">
                            {normalizeMentorshipMode(item.mode) === 'Google Meet'
                              ? 'Google Meet'
                              : isEn
                              ? 'In-Person Hub'
                              : 'Bersemuka di Hab'}
                          </span>
                        </div>
                        <p className="text-sm text-black/75 dark:text-white/80 truncate">
                          {item.topic}
                        </p>
                        {item.mentorActionPlan && (
                          <p className="text-xs sm:text-sm text-black/65 dark:text-white/70 whitespace-pre-line pt-0.5">
                            {item.mentorActionPlan}
                          </p>
                        )}
                      </div>

                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-black/75 dark:text-white/80 self-start sm:self-center whitespace-nowrap shrink-0">
                        <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>{meta.label}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
              <PaginationBar
                currentPage={historyPagination.currentPage}
                totalItems={historyPagination.totalItems}
                itemsPerPage={3}
                onPageChange={historyPagination.setCurrentPage}
                itemLabel={isEn ? 'sessions' : 'sesi'}
                accent="teal"
                variant="compact"
              />
            </>
          )}
        </div>
      </section>

      {/* ================================================================= */}
      {/* SECTION 2: AUTO-ROTATING MENTOR SPOTLIGHT HERO CARD               */}
      {/* ================================================================= */}
      <section
        aria-labelledby="mentor-spotlight-heading"
        onMouseEnter={() => setIsSpotlightHovered(true)}
        onMouseLeave={() => setIsSpotlightHovered(false)}
        onFocusCapture={() => setIsSpotlightHovered(true)}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsSpotlightHovered(false);
          }
        }}
      >
        <div className="rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xs overflow-hidden">
          {spotlightMentor ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
              <div
                onClick={() => setDetailMentor(spotlightMentor)}
                className="lg:col-span-4 relative min-h-[220px] sm:min-h-[250px] bg-slate-100 dark:bg-zinc-800 overflow-hidden cursor-pointer group"
              >
                {spotlightMentor.avatarUrl && !brokenAvatarIds[spotlightMentor.id] ? (
                  <img
                    key={spotlightMentor.id}
                    src={spotlightMentor.avatarUrl}
                    alt={spotlightMentor.name}
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setBrokenAvatarIds((prev) => ({ ...prev, [spotlightMentor.id]: true }))
                    }
                    className="w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-zinc-800 dark:to-zinc-900 text-black dark:text-white p-6">
                    <span className="text-3xl font-black tracking-tight">
                      {getInitials(spotlightMentor.name)}
                    </span>
                    <span className="text-xs font-semibold text-black/60 dark:text-white/65 mt-1 text-center">
                      {spotlightMentor.agency}
                    </span>
                  </div>
                )}
              </div>

              <div className="lg:col-span-8 p-5 sm:p-6 lg:p-7 flex flex-col justify-between gap-5">
                <div className="space-y-2.5" aria-live="polite">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                    <span id="mentor-spotlight-heading" className="inline-flex items-center gap-1.5 text-teal-700 dark:text-teal-400">
                      <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                      <span>{isEn ? 'Mentor Spotlight' : 'Tumpuan Mentor'}</span>
                    </span>
                    <span className="text-black/30 dark:text-white/30">·</span>
                    <span className="text-black/65 dark:text-white/70">
                      {spotlightMentor.agency}
                    </span>
                  </div>

                  <div>
                    <h2
                      onClick={() => setDetailMentor(spotlightMentor)}
                      className="text-xl sm:text-2xl font-extrabold text-black dark:text-white tracking-tight leading-snug text-balance cursor-pointer hover:text-teal-700 dark:hover:text-teal-400 transition-colors"
                    >
                      {spotlightMentor.name}
                    </h2>
                    <p className="text-sm font-semibold text-teal-700 dark:text-teal-400 mt-0.5">
                      {spotlightMentor.title}
                    </p>
                  </div>

                  <p className="text-sm sm:text-base text-black/70 dark:text-white/75 leading-relaxed line-clamp-2">
                    {spotlightMentor.bio}
                  </p>

                  <div className="pt-2.5 border-t border-slate-100 dark:border-zinc-800 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-black/70 dark:text-white/75 tabular-nums">
                    <span>{spotlightMentor.expertise.slice(0, 3).join(' · ')}</span>
                    <span className="text-black/30 dark:text-white/30">·</span>
                    <span>{spotlightMentor.availableDays}</span>
                    <span className="text-black/30 dark:text-white/30">·</span>
                    <span>
                      {spotlightMentor.activeMenteesCount ?? 0} {isEn ? 'mentees' : 'usahawan'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex flex-wrap items-center gap-3">
                    {(activeSession?.mentorId === spotlightMentor.id || !hasActiveSession) && (
                      activeSession?.mentorId === spotlightMentor.id ? (
                        <button
                          type="button"
                          disabled
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-black dark:text-white text-sm font-bold cursor-not-allowed whitespace-nowrap shrink-0"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>{isEn ? 'Active Mentor' : 'Mentor Aktif Anda'}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSelectMentor(spotlightMentor)}
                          className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                            selectedMentor?.id === spotlightMentor.id
                              ? 'bg-slate-900 dark:bg-white text-white dark:text-black'
                              : 'bg-teal-600 hover:bg-teal-700 text-white shadow-2xs'
                          }`}
                        >
                          <span>
                            {selectedMentor?.id === spotlightMentor.id
                              ? (isEn ? 'Selected Below' : 'Sedang Dipilih')
                              : (isEn ? 'Select Mentor' : 'Pilih Mentor')}
                          </span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      onClick={() => setDetailMentor(spotlightMentor)}
                      className="py-2 px-3 rounded-xl text-sm font-bold text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <span>{isEn ? 'View Profile' : 'Lihat Profil'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {filteredMentors.length > 1 && (
                    <div
                      className="flex items-center gap-1.5"
                      role="tablist"
                      aria-label={isEn ? 'Featured mentors' : 'Pilihan mentor tumpuan'}
                    >
                      {filteredMentors.map((m, idx) => {
                        const isActiveSlide = idx === safeSpotlightIndex;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            role="tab"
                            aria-selected={isActiveSlide}
                            aria-label={m.name}
                            onClick={() => setSpotlightIndex(idx)}
                            className={`h-1.5 rounded-full transition-all cursor-pointer ${
                              isActiveSlide
                                ? 'w-6 bg-teal-600 dark:bg-teal-400'
                                : 'w-2.5 bg-slate-200 dark:bg-zinc-700 hover:bg-slate-300 dark:hover:bg-zinc-600'
                            }`}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center space-y-2">
              <p className="text-sm font-bold text-black dark:text-white">
                {isEn ? 'No Matching Mentors Found' : 'Tiada Mentor Sepadan Ditemui'}
              </p>
              <p className="text-sm text-black/70 dark:text-white/75">
                {isEn
                  ? 'Clear your filters to browse all available mentors.'
                  : 'Set semula penapis untuk melihat semua mentor yang tersedia.'}
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-1 px-4 py-2 rounded-xl border border-slate-300 dark:border-zinc-600 text-sm font-bold text-black dark:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                {isEn ? 'Reset Filters' : 'Set Semula Penapis'}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ================================================================= */}
      {/* SECTION 3: INLINE BOOKING WORKSPACE (WHEN MENTOR SELECTED)        */}
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
                <p className="text-[0.9375rem] text-black/75 dark:text-white/75">
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
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-black dark:text-white text-sm font-semibold transition-colors cursor-pointer self-start sm:self-auto whitespace-nowrap shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              <span>{isEn ? 'Change Mentor' : 'Tukar Mentor'}</span>
            </button>
          </div>

          <form onSubmit={handleSubmitBooking} className="p-5 sm:p-6 space-y-5">
            {validationError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-700 text-sm text-black dark:text-white flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                  {isEn ? 'Full Name' : 'Nama Penuh'} *
                </label>
                <input
                  type="text"
                  required
                  value={entrepreneurName}
                  onChange={(e) => setEntrepreneurName(e.target.value)}
                  placeholder={isEn ? 'Enter full name' : 'Masukkan nama penuh'}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                  {isEn ? 'Phone Number' : 'Nombor Telefon'} *
                </label>
                <input
                  type="text"
                  required
                  value={entrepreneurPhone}
                  onChange={(e) => setEntrepreneurPhone(e.target.value)}
                  placeholder={isEn ? 'Enter phone number' : 'Masukkan nombor telefon'}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                  {isEn ? 'Business Name' : 'Nama Perniagaan'} *
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder={isEn ? 'Enter business name' : 'Masukkan nama perniagaan'}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                  {isEn ? 'District' : 'Daerah'} *
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value as KelantanDistrict)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 text-black dark:text-white focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 cursor-pointer"
                >
                  {KELANTAN_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                  {isEn ? 'Advisory Topic' : 'Topik Bimbingan'} *
                </label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 text-black dark:text-white focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 cursor-pointer"
                >
                  {(isEn ? TOPIC_OPTIONS_EN : TOPIC_OPTIONS_MS).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                  {isEn ? 'Session Mode' : 'Mod Sesi'} *
                </label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as 'Bersemuka di Kampus' | 'Google Meet')}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 text-black dark:text-white focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 cursor-pointer"
                >
                  <option value="Bersemuka di Kampus">
                    {isEn ? 'In-Person (Entrepreneur Hub)' : 'Bersemuka di Hab Usahawan'}
                  </option>
                  <option value="Google Meet">
                    Google Meet
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                  {isEn ? 'Session Date' : 'Tarikh Sesi'} *
                </label>
                <ModernDatePicker
                  value={preferredDate}
                  onChange={setPreferredDate}
                  valueFormat="malay-day"
                  minDate={todayIso}
                  quickDates={quickMentorDates}
                  isEn={isEn}
                  accentColor="teal"
                  placeholder={isEn ? 'Choose session date' : 'Pilih tarikh sesi'}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                  {isEn ? 'Session Time' : 'Masa Sesi'} *
                </label>
                <ModernTimePicker
                  value={preferredTime}
                  onChange={setPreferredTime}
                  mode="range"
                  allowRangeToggle
                  formatStyle="12h-am"
                  quickSlots={quickMentorTimes}
                  defaultDurationMinutes={60}
                  isEn={isEn}
                  accentColor="teal"
                  placeholder={isEn ? 'Choose session time' : 'Pilih masa sesi'}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                {isEn ? 'Application Details' : 'Keterangan Permohonan'}
              </label>
              <textarea
                rows={2}
                value={challenges}
                onChange={(e) => setChallenges(e.target.value)}
                placeholder={
                  isEn
                    ? 'Enter application details'
                    : 'Masukkan keterangan permohonan'
                }
                className="w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => {
                  setSelectedMentor(null);
                  setValidationError(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-black dark:text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                {isEn ? 'Cancel' : 'Batal'}
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold transition-colors cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isEn ? 'Confirm Booking' : 'Sahkan Tempahan'}</span>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ================================================================= */}
      {/* SECTION 4: INTEGRATED TOOLBAR + 3-COLUMN MENTOR PROFILE GRID      */}
      {/* ================================================================= */}
      <div className="rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xs overflow-visible">
        <ReferenceTableToolbar
          accent="teal"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={
            isEn
              ? 'Search mentor or topic...'
              : 'Cari mentor atau topik...'
          }
          filterCount={activeFilterCount}
          onResetFilters={() => {
            setAgencyFilter('all');
            setExpertiseFilter('all');
          }}
          filterContent={
            <>
              <div>
                <label className="block text-[0.8125rem] font-bold text-black/75 dark:text-white/80 mb-1.5">
                  {isEn ? 'Mentor Type' : 'Kategori Mentor'}
                </label>
                <select
                  value={agencyFilter}
                  onChange={(e) => setAgencyFilter(e.target.value as 'all' | 'internal' | 'industry')}
                  aria-label={isEn ? 'Mentor Type' : 'Kategori Mentor'}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                >
                  <option value="all">{isEn ? 'All Mentors' : 'Semua Mentor'}</option>
                  <option value="internal">{isEn ? 'Internal Mentors' : 'Mentor Dalaman'}</option>
                  <option value="industry">{isEn ? 'Industry Experts' : 'Pakar Industri'}</option>
                </select>
              </div>

              <div>
                <label className="block text-[0.8125rem] font-bold text-black/75 dark:text-white/80 mb-1.5">
                  {isEn ? 'Expertise Area' : 'Bidang Kepakaran'}
                </label>
                <select
                  value={expertiseFilter}
                  onChange={(e) => setExpertiseFilter(e.target.value)}
                  aria-label={isEn ? 'Filter by expertise' : 'Tapis mengikut bidang kepakaran'}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                >
                  <option value="all">
                    {isEn ? 'All Expertise Areas' : 'Semua Bidang Kepakaran'}
                  </option>
                  {availableExpertiseOptions.map((exp) => (
                    <option key={exp} value={exp}>
                      {exp}
                    </option>
                  ))}
                </select>
              </div>
            </>
          }
        />

        {filteredMentors.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="text-sm font-bold text-black dark:text-white">
              {isEn ? 'No Matching Mentors Found' : 'Tiada Mentor Ditemui'}
            </p>
            <p className="text-sm text-black/70 dark:text-white/75">
              {isEn
                ? 'Try clearing your search keyword or changing the agency and expertise filters.'
                : 'Cuba tukar kata carian atau pilih penapis agensi dan kepakaran lain.'}
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-2 px-4 py-2 rounded-xl border border-slate-300 dark:border-zinc-600 text-sm font-bold text-black dark:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              {isEn ? 'Reset Filters' : 'Set Semula Penapis'}
            </button>
          </div>
        ) : (
          <>
            <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
              {mentorPagination.paginatedItems.map((mentor) => {
                const isCurrentBookedMentor = activeSession?.mentorId === mentor.id;
                const isSelectedForForm = selectedMentor?.id === mentor.id && !hasActiveSession;
                const showFallbackAvatar = !mentor.avatarUrl || brokenAvatarIds[mentor.id];

                return (
                  <article
                    key={mentor.id}
                    onClick={() => setDetailMentor(mentor)}
                    className={`rounded-2xl bg-white dark:bg-zinc-900 border transition-colors flex flex-col justify-between overflow-hidden cursor-pointer group ${
                      isCurrentBookedMentor || isSelectedForForm
                        ? 'border-teal-500 dark:border-teal-400'
                        : 'border-slate-200 dark:border-zinc-700 hover:border-teal-500 dark:hover:border-zinc-500'
                    }`}
                  >
                    <div>
                      <div className="aspect-[16/10] w-full bg-slate-100 dark:bg-zinc-800 border-b border-slate-100 dark:border-zinc-800 overflow-hidden">
                        {!showFallbackAvatar ? (
                          <img
                            src={mentor.avatarUrl}
                            alt={mentor.name}
                            referrerPolicy="no-referrer"
                            onError={() =>
                              setBrokenAvatarIds((prev) => ({ ...prev, [mentor.id]: true }))
                            }
                            className="w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-zinc-800 dark:to-zinc-900 text-black dark:text-white p-4">
                            <span className="text-2xl font-black tracking-tight">
                              {getInitials(mentor.name)}
                            </span>
                            <span className="text-xs font-semibold text-black/60 dark:text-white/65 mt-1 text-center truncate max-w-full">
                              {mentor.agency}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-4 sm:p-5 pb-3">
                        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                          <span className="text-teal-700 dark:text-teal-400 uppercase tracking-wider font-bold truncate">
                            {mentor.agency}
                          </span>
                          <span className="text-black/30 dark:text-white/30">·</span>
                          <span
                            className={`tabular-nums ${
                              isCurrentBookedMentor
                                ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                                : 'text-black/60 dark:text-white/65'
                            }`}
                          >
                            {isCurrentBookedMentor
                              ? (isEn ? 'Active Mentor' : 'Aktif')
                              : `${mentor.activeMenteesCount ?? 0} ${isEn ? 'mentees' : 'usahawan'}`}
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-black dark:text-white leading-snug line-clamp-1 mt-1.5 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
                          {mentor.name}
                        </h3>

                        <p className="text-xs sm:text-sm font-medium text-black/75 dark:text-white/80 truncate mt-0.5">
                          {mentor.title}
                        </p>

                        <p className="text-sm text-black/65 dark:text-white/70 leading-relaxed line-clamp-2 mt-2">
                          {mentor.bio}
                        </p>

                        <div className="mt-3 text-xs text-black/60 dark:text-white/65 truncate tabular-nums">
                          {mentor.availableDays} · {mentor.expertise.slice(0, 2).join(', ')}
                        </div>
                      </div>
                    </div>

                    {/* Card Footer: Profile Link + Direct Select Button */}
                    <div className="px-4 sm:px-5 py-3.5 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-2.5">
                      <span className="text-xs font-semibold text-teal-700 dark:text-teal-400 inline-flex items-center gap-1 group-hover:underline whitespace-nowrap">
                        <span>{isEn ? 'Profile' : 'Profil'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>

                      {(isCurrentBookedMentor || !hasActiveSession) && (
                        <div
                          className="shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {isCurrentBookedMentor ? (
                            <button
                              type="button"
                              disabled
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-black dark:text-white text-xs font-bold cursor-not-allowed whitespace-nowrap"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>{isEn ? 'Active' : 'Mentor Aktif'}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSelectMentor(mentor)}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                                isSelectedForForm
                                  ? 'bg-slate-900 dark:bg-white text-white dark:text-black'
                                  : 'bg-teal-600 hover:bg-teal-700 text-white'
                              }`}
                            >
                              <span>
                                {isSelectedForForm
                                  ? (isEn ? 'Selected' : 'Dipilih')
                                  : (isEn ? 'Select Mentor' : 'Pilih Mentor')}
                              </span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            <PaginationBar
              currentPage={mentorPagination.currentPage}
              totalItems={mentorPagination.totalItems}
              itemsPerPage={6}
              onPageChange={mentorPagination.setCurrentPage}
              itemLabel={isEn ? 'mentors' : 'mentor'}
              accent="teal"
            />
          </>
        )}
      </div>

      {/* Mentor Full Profile Modal */}
      {detailMentor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]"
          onClick={() => setDetailMentor(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="mentor-profile-modal-title"
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[16/9] w-full bg-slate-100 dark:bg-zinc-800 border-b border-slate-200 dark:border-zinc-700 shrink-0 overflow-hidden">
              {detailMentor.avatarUrl && !brokenAvatarIds[detailMentor.id] ? (
                <img
                  src={detailMentor.avatarUrl}
                  alt={detailMentor.name}
                  referrerPolicy="no-referrer"
                  onError={() =>
                    setBrokenAvatarIds((prev) => ({ ...prev, [detailMentor.id]: true }))
                  }
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-zinc-800 dark:to-zinc-900 text-black dark:text-white p-6">
                  <span className="text-4xl font-black tracking-tight">
                    {getInitials(detailMentor.name)}
                  </span>
                  <span className="text-sm font-semibold text-black/65 dark:text-white/70 mt-1">
                    {detailMentor.agency}
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={() => setDetailMentor(null)}
                aria-label={isEn ? 'Close profile' : 'Tutup profil'}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 dark:bg-zinc-900/95 text-black dark:text-white border border-slate-200 dark:border-zinc-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              <div>
                <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                  <span className="text-teal-700 dark:text-teal-400">
                    {detailMentor.agency}
                  </span>
                  <span className="text-black/30 dark:text-white/30">·</span>
                  <span className="text-black/60 dark:text-white/65 tabular-nums">
                    {detailMentor.activeMenteesCount ?? 0} {isEn ? 'mentees guided' : 'usahawan dibimbing'}
                  </span>
                </div>
                <h2
                  id="mentor-profile-modal-title"
                  className="text-xl sm:text-2xl font-extrabold text-black dark:text-white tracking-tight mt-1.5 text-balance"
                >
                  {detailMentor.name}
                </h2>
                <p className="text-sm sm:text-base font-semibold text-teal-700 dark:text-teal-400 mt-0.5">
                  {detailMentor.title}
                </p>
              </div>

              {/* Structured Facts Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-y border-slate-200 dark:border-zinc-700 py-4 text-sm">
                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-black/55 dark:text-white/60 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-black/55 dark:text-white/60 block">
                      {isEn ? 'Available Days' : 'Hari Tersedia'}
                    </span>
                    <span className="font-semibold text-black dark:text-white tabular-nums">
                      {detailMentor.availableDays}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Users className="w-4 h-4 text-black/55 dark:text-white/60 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-black/55 dark:text-white/60 block">
                      {isEn ? 'Active Mentees' : 'Usahawan Dibimbing'}
                    </span>
                    <span className="font-semibold text-black dark:text-white tabular-nums">
                      {detailMentor.activeMenteesCount ?? 0} {isEn ? 'entrepreneurs' : 'usahawan belia'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-black/55 dark:text-white/60">
                  {isEn ? 'Advisor Background & Bio' : 'Latar Belakang & Pengalaman'}
                </h3>
                <p className="text-sm sm:text-base text-black/75 dark:text-white/80 leading-relaxed whitespace-pre-line">
                  {detailMentor.bio}
                </p>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-black/55 dark:text-white/60">
                  {isEn ? 'Areas of Expertise' : 'Bidang Kepakaran'}
                </h3>
                <p className="text-sm font-medium text-black dark:text-white leading-relaxed">
                  {detailMentor.expertise.join(' · ')}
                </p>
              </div>
            </div>

            <div className="px-5 sm:px-6 py-4 bg-slate-50 dark:bg-zinc-950/60 border-t border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setDetailMentor(null)}
                className="py-2 px-4 rounded-xl text-sm font-semibold border border-slate-200 dark:border-zinc-700 text-black dark:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer whitespace-nowrap"
              >
                {isEn ? 'Close' : 'Tutup'}
              </button>

              {activeSession?.mentorId === detailMentor.id ? (
                <span className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-black dark:text-white text-sm font-bold whitespace-nowrap">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{isEn ? 'Your Active Mentor' : 'Mentor Aktif Anda'}</span>
                </span>
              ) : hasActiveSession ? (
                <span className="text-xs sm:text-sm font-medium text-black/65 dark:text-white/70">
                  {isEn
                    ? 'Cancel active appointment to switch mentor.'
                    : 'Batalkan temu janji aktif untuk menukar mentor.'}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const target = detailMentor;
                    setDetailMentor(null);
                    handleSelectMentor(target);
                  }}
                  className="py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <span>{isEn ? 'Select Mentor & Book Session' : 'Pilih Mentor & Tempah Sesi'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
