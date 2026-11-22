import React, { useMemo, useState } from 'react';
import {
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  MapPin,
  Phone,
  Plus,
  Trash2,
  Users,
  Video,
  X,
  XCircle
} from 'lucide-react';
import {
  BusinessListing,
  MentorProfile,
  MentorshipRegistration,
  PublishedMentorSlot,
  normalizeMentorshipMode
} from '../types';
import { toLocalIsoDate } from './ModernDateTimePicker';
import { PortalImage } from './PortalImage';
import { resolveMenteeVisuals } from '../utils/visualAssets';
import { showToast as triggerToast } from './ToastNotification';

interface MentorScheduleCalendarProps {
  currentMentor: MentorProfile;
  registrations: MentorshipRegistration[];
  businesses: BusinessListing[];
  isEn: boolean;
  onStatusChange: (mentee: MentorshipRegistration, newStatus: MentorshipRegistration['status']) => void;
  onOpenNotesModal: (mentee: MentorshipRegistration) => void;
  onOpenCreateSlotModal: (prefillDateMalay?: string, prefillTime?: string) => void;
  onDeletePublishedSlot: (slotId: string) => void;
}

type CalendarViewMode = 'daily' | 'weekly' | 'monthly';

type CalendarEventKind = 'confirmed' | 'pending' | 'completed' | 'open_slot';

interface CalendarEventItem {
  id: string;
  kind: CalendarEventKind;
  title: string;
  subtitle: string;
  dateIso: string;
  dateObj: Date;
  startMins: number;
  endMins: number;
  timeLabel: string;
  mode: 'Google Meet' | 'Bersemuka di Kampus';
  registration?: MentorshipRegistration;
  slot?: PublishedMentorSlot;
}

const MONTH_NAME_MAP: Record<string, number> = {
  jan: 0,
  januari: 0,
  january: 0,
  feb: 1,
  februari: 1,
  february: 1,
  mac: 2,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  mei: 4,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  julai: 6,
  july: 6,
  ogo: 7,
  ogos: 7,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  okt: 9,
  oct: 9,
  oktober: 9,
  october: 9,
  nov: 10,
  november: 10,
  dis: 11,
  dec: 11,
  disember: 11,
  december: 11
};

const MALAY_MONTHS_FULL = [
  'Januari',
  'Februari',
  'Mac',
  'April',
  'Mei',
  'Jun',
  'Julai',
  'Ogos',
  'September',
  'Oktober',
  'November',
  'Disember'
];

const MALAY_MONTHS_SHORT = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogos', 'Sep', 'Okt', 'Nov', 'Dis'];
const EN_MONTHS_FULL = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];
const EN_MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const MALAY_WEEKDAYS_FULL = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
const EN_WEEKDAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MALAY_WEEKDAYS_INITIALS = ['A', 'I', 'S', 'R', 'K', 'J', 'S'];
const EN_WEEKDAYS_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const GRID_START_HOUR = 8; // 08:00
const GRID_END_HOUR = 18; // 18:00
const HOUR_ROW_HEIGHT = 64; // px per hour

function parseFlexibleDate(raw?: string): Date | null {
  if (!raw || !raw.trim()) return null;
  const cleaned = raw.trim().replace(/\(.*?\)/g, '').trim();

  // 1. ISO YYYY-MM-DD
  const isoMatch = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const y = Number(isoMatch[1]);
    const m = Number(isoMatch[2]) - 1;
    const d = Number(isoMatch[3]);
    const dt = new Date(y, m, d);
    if (!Number.isNaN(dt.getTime())) return dt;
  }

  // 2. DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = cleaned.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const d = Number(dmyMatch[1]);
    const m = Number(dmyMatch[2]) - 1;
    const y = Number(dmyMatch[3]);
    const dt = new Date(y, m, d);
    if (!Number.isNaN(dt.getTime())) return dt;
  }

  // 3. "28 Mac 2026" or "30 March 2026"
  const textMatch = cleaned.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (textMatch) {
    const d = Number(textMatch[1]);
    const monthKey = textMatch[2].toLowerCase();
    const y = Number(textMatch[3]);
    if (monthKey in MONTH_NAME_MAP) {
      const dt = new Date(y, MONTH_NAME_MAP[monthKey], d);
      if (!Number.isNaN(dt.getTime())) return dt;
    }
  }

  const parsedFallback = new Date(cleaned);
  if (!Number.isNaN(parsedFallback.getTime())) {
    return new Date(parsedFallback.getFullYear(), parsedFallback.getMonth(), parsedFallback.getDate());
  }
  return null;
}

function parseSingleTimeMinutes(token: string): number | null {
  const clean = token.trim().toLowerCase();
  const m = clean.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|pg|ptg|tgh|mlm)?/i);
  if (!m) return null;
  let hour = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  const suffix = (m[3] || '').toLowerCase();
  if (suffix === 'pm' || suffix === 'ptg' || suffix === 'mlm') {
    if (hour < 12) hour += 12;
  } else if (suffix === 'am' || suffix === 'pg') {
    if (hour === 12) hour = 0;
  } else if (suffix === 'tgh') {
    if (hour < 12) hour += 12;
  }
  return hour * 60 + min;
}

function parseTimeRange(raw?: string): { startMins: number; endMins: number } {
  if (!raw || !raw.trim()) return { startMins: 10 * 60, endMins: 11 * 60 };
  const parts = raw.split(/\s*[-–—]\s*/);
  const start = parseSingleTimeMinutes(parts[0] || '');
  const startMins = start !== null ? start : 10 * 60;
  let endMins = parts[1] ? parseSingleTimeMinutes(parts[1]) : null;
  if (endMins === null || endMins <= startMins) {
    endMins = startMins + 60;
  }
  return { startMins, endMins };
}

function formatHourMinutes12h(totalMins: number, isEn: boolean): string {
  const h24 = Math.floor(totalMins / 60) % 24;
  const m = totalMins % 60;
  const isPm = h24 >= 12;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const suffix = isEn ? (isPm ? 'PM' : 'AM') : isPm ? (h24 === 12 ? 'TGH' : 'PTG') : 'PG';
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

function formatHourLabel24h(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

function formatHourRangeForSlotModal(hour: number): string {
  const startIsPm = hour >= 12;
  const startH12 = hour % 12 === 0 ? 12 : hour % 12;
  const endHour = hour + 1;
  const endIsPm = endHour >= 12;
  const endH12 = endHour % 12 === 0 ? 12 : endHour % 12;
  return `${startH12}:00 ${startIsPm ? 'PM' : 'AM'} - ${endH12}:00 ${endIsPm ? 'PM' : 'AM'}`;
}

function formatDateToMalayDay(dt: Date): string {
  const d = dt.getDate();
  const m = MALAY_MONTHS_SHORT[dt.getMonth()];
  const y = dt.getFullYear();
  const wd = MALAY_WEEKDAYS_FULL[dt.getDay()];
  return `${d} ${m} ${y} (${wd})`;
}

function startOfWeekSunday(dt: Date): Date {
  const res = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  res.setDate(res.getDate() - res.getDay());
  return res;
}

function addDays(dt: Date, delta: number): Date {
  const res = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  res.setDate(res.getDate() + delta);
  return res;
}

interface PositionedEvent {
  event: CalendarEventItem;
  colIndex: number;
  totalCols: number;
}

function layoutDayEvents(events: CalendarEventItem[]): PositionedEvent[] {
  const sorted = [...events].sort((a, b) => a.startMins - b.startMins || a.endMins - b.endMins);
  const clusters: CalendarEventItem[][] = [];
  for (const ev of sorted) {
    let placed = false;
    for (const cluster of clusters) {
      const clusterEnd = Math.max(...cluster.map((c) => c.endMins));
      if (ev.startMins < clusterEnd) {
        cluster.push(ev);
        placed = true;
        break;
      }
    }
    if (!placed) clusters.push([ev]);
  }

  const positioned: PositionedEvent[] = [];
  for (const cluster of clusters) {
    const colEnds: number[] = [];
    const assignedCols: number[] = [];
    for (const ev of cluster) {
      let col = colEnds.findIndex((end) => end <= ev.startMins);
      if (col === -1) {
        col = colEnds.length;
        colEnds.push(ev.endMins);
      } else {
        colEnds[col] = ev.endMins;
      }
      assignedCols.push(col);
    }
    const totalCols = Math.max(1, colEnds.length);
    cluster.forEach((ev, idx) => {
      positioned.push({ event: ev, colIndex: assignedCols[idx], totalCols });
    });
  }
  return positioned;
}

export const MentorScheduleCalendar: React.FC<MentorScheduleCalendarProps> = ({
  currentMentor,
  registrations,
  businesses,
  isEn,
  onStatusChange,
  onOpenNotesModal,
  onOpenCreateSlotModal,
  onDeletePublishedSlot
}) => {
  const todayObj = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);
  const todayIso = useMemo(() => toLocalIsoDate(todayObj), [todayObj]);

  // Read published open slots synced across mentor profile + localStorage
  const publishedSlots = useMemo<PublishedMentorSlot[]>(() => {
    const fromMentor = currentMentor.publishedSlots || [];
    let fromLocal: PublishedMentorSlot[] = [];
    try {
      const raw = localStorage.getItem(`kbelia_mentor_published_slots_${currentMentor.id}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) fromLocal = parsed;
      }
    } catch {
      // ignore
    }
    const merged = [...fromMentor, ...fromLocal];
    return merged.filter(
      (slot, idx, arr) =>
        slot &&
        slot.id &&
        arr.findIndex((s) => s.id === slot.id || (s.date === slot.date && s.time === slot.time)) === idx
    );
  }, [currentMentor.id, currentMentor.publishedSlots]);

  // Convert registrations & open slots into unified calendar events
  const allEvents = useMemo<CalendarEventItem[]>(() => {
    const items: CalendarEventItem[] = [];

    for (const reg of registrations) {
      if (reg.status === 'cancelled') continue;
      const parsedDate = parseFlexibleDate(reg.preferredDate) || parseFlexibleDate(reg.createdAt) || todayObj;
      const dateIso = toLocalIsoDate(parsedDate);
      const { startMins, endMins } = parseTimeRange(reg.preferredTime);
      const mode = normalizeMentorshipMode(reg.mode);
      const kind: CalendarEventKind =
        reg.status === 'pending' ? 'pending' : reg.status === 'completed' ? 'completed' : 'confirmed';

      items.push({
        id: `reg_${reg.id}`,
        kind,
        title: reg.businessName || reg.entrepreneurName,
        subtitle: `${reg.entrepreneurName} · ${reg.topic}`,
        dateIso,
        dateObj: parsedDate,
        startMins,
        endMins,
        timeLabel: `${formatHourMinutes12h(startMins, isEn)} - ${formatHourMinutes12h(endMins, isEn)}`,
        mode,
        registration: reg
      });
    }

    for (const slot of publishedSlots) {
      const parsedDate = parseFlexibleDate(slot.date);
      if (!parsedDate) continue;
      const dateIso = toLocalIsoDate(parsedDate);
      const { startMins, endMins } = parseTimeRange(slot.time);
      const mode = normalizeMentorshipMode(slot.mode);

      // Skip showing open slot if an active booking already occupies the exact same date & start time
      const alreadyBooked = items.some(
        (ev) => ev.dateIso === dateIso && Math.abs(ev.startMins - startMins) < 15 && ev.kind !== 'completed'
      );
      if (alreadyBooked) continue;

      items.push({
        id: `slot_${slot.id}`,
        kind: 'open_slot',
        title: isEn ? 'Open Mentorship Slot' : 'Slot Terbuka Mentor',
        subtitle: mode === 'Google Meet' ? 'Google Meet' : isEn ? 'Entrepreneur Hub' : 'Hab Usahawan',
        dateIso,
        dateObj: parsedDate,
        startMins,
        endMins,
        timeLabel: `${formatHourMinutes12h(startMins, isEn)} - ${formatHourMinutes12h(endMins, isEn)}`,
        mode,
        slot
      });
    }

    return items.sort((a, b) => a.dateIso.localeCompare(b.dateIso) || a.startMins - b.startMins);
  }, [registrations, publishedSlots, isEn, todayObj]);

  // Smart initial date: center on nearest active session or today if current month has events
  const initialFocusDate = useMemo(() => {
    const activeUpcoming = allEvents.find((ev) => ev.kind === 'pending' || ev.kind === 'confirmed');
    if (activeUpcoming) return activeUpcoming.dateObj;
    if (allEvents.length > 0) return allEvents[0].dateObj;
    return todayObj;
  }, [allEvents, todayObj]);

  const [selectedDate, setSelectedDate] = useState<Date>(initialFocusDate);
  const [miniMonthDate, setMiniMonthDate] = useState<Date>(
    () => new Date(initialFocusDate.getFullYear(), initialFocusDate.getMonth(), 1)
  );
  const [viewMode, setViewMode] = useState<CalendarViewMode>('weekly');

  // Filter states (matching reference left-panel "Penapis" & "Kalendar Lain")
  const [statusFilters, setStatusFilters] = useState<Record<CalendarEventKind, boolean>>({
    confirmed: true,
    pending: true,
    open_slot: true,
    completed: true
  });
  const [modeFilters, setModeFilters] = useState<{ googleMeet: boolean; inPerson: boolean }>({
    googleMeet: true,
    inPerson: true
  });
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
  const [isOtherCalendarsOpen, setIsOtherCalendarsOpen] = useState(true);

  // Reminder dismissal tracking so clicking X cycles cleanly through upcoming items
  const [dismissedReminderIds, setDismissedReminderIds] = useState<string[]>([]);

  // Modal state for clicking an appointment or open slot
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventItem | null>(null);

  const filteredEvents = useMemo(() => {
    return allEvents.filter((ev) => {
      if (!statusFilters[ev.kind]) return false;
      if (ev.mode === 'Google Meet' && !modeFilters.googleMeet) return false;
      if (ev.mode === 'Bersemuka di Kampus' && !modeFilters.inPerson) return false;
      return true;
    });
  }, [allEvents, statusFilters, modeFilters]);

  const eventsByDateIso = useMemo(() => {
    const map: Record<string, CalendarEventItem[]> = {};
    for (const ev of filteredEvents) {
      if (!map[ev.dateIso]) map[ev.dateIso] = [];
      map[ev.dateIso].push(ev);
    }
    return map;
  }, [filteredEvents]);

  // All dates that have at least one event (used for mini-calendar date indicator)
  const eventDateSet = useMemo(() => new Set(allEvents.map((e) => e.dateIso)), [allEvents]);

  // Next actionable reminder for the Teal Featured Card
  const reminderCandidates = useMemo(() => {
    const prioritized = allEvents.filter(
      (ev) => (ev.kind === 'pending' || ev.kind === 'confirmed') && !dismissedReminderIds.includes(ev.id)
    );
    return prioritized.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'pending' ? -1 : 1;
      return a.dateIso.localeCompare(b.dateIso) || a.startMins - b.startMins;
    });
  }, [allEvents, dismissedReminderIds]);

  const activeReminder = reminderCandidates[0] || null;

  const selectedDateIso = toLocalIsoDate(selectedDate);

  const navigatePeriod = (dir: -1 | 1) => {
    if (viewMode === 'daily') {
      const next = addDays(selectedDate, dir);
      setSelectedDate(next);
      setMiniMonthDate(new Date(next.getFullYear(), next.getMonth(), 1));
    } else if (viewMode === 'weekly') {
      const next = addDays(selectedDate, dir * 7);
      setSelectedDate(next);
      setMiniMonthDate(new Date(next.getFullYear(), next.getMonth(), 1));
    } else {
      const next = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + dir, 1);
      setSelectedDate(next);
      setMiniMonthDate(next);
    }
  };

  const handleJumpToday = () => {
    setSelectedDate(todayObj);
    setMiniMonthDate(new Date(todayObj.getFullYear(), todayObj.getMonth(), 1));
  };

  const handleJumpToDate = (dt: Date) => {
    const normalized = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    setSelectedDate(normalized);
    setMiniMonthDate(new Date(normalized.getFullYear(), normalized.getMonth(), 1));
  };

  // Compute visible 7 days for weekly view
  const weekDays = useMemo(() => {
    const start = startOfWeekSunday(selectedDate);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDate]);

  // Compute mini calendar 42-cell grid
  const miniCalendarDays = useMemo(() => {
    const year = miniMonthDate.getFullYear();
    const month = miniMonthDate.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const gridStart = addDays(firstOfMonth, -firstOfMonth.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const dt = addDays(gridStart, i);
      return {
        date: dt,
        iso: toLocalIsoDate(dt),
        inCurrentMonth: dt.getMonth() === month
      };
    });
  }, [miniMonthDate]);

  // Compute full monthly view 42-cell grid
  const mainMonthDays = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const gridStart = addDays(firstOfMonth, -firstOfMonth.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const dt = addDays(gridStart, i);
      return {
        date: dt,
        iso: toLocalIsoDate(dt),
        inCurrentMonth: dt.getMonth() === month
      };
    });
  }, [selectedDate]);

  // Toolbar display title
  const toolbarRangeTitle = useMemo(() => {
    const monthsFull = isEn ? EN_MONTHS_FULL : MALAY_MONTHS_FULL;
    const monthsShort = isEn ? EN_MONTHS_SHORT : MALAY_MONTHS_SHORT;
    if (viewMode === 'daily') {
      return `${selectedDate.getDate()} ${monthsFull[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
    }
    if (viewMode === 'monthly') {
      return `${monthsFull[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
    }
    const first = weekDays[0];
    const last = weekDays[6];
    if (first.getMonth() === last.getMonth()) {
      return `${first.getDate()} – ${last.getDate()} ${monthsShort[first.getMonth()]} ${first.getFullYear()}`;
    }
    return `${first.getDate()} ${monthsShort[first.getMonth()]} – ${last.getDate()} ${monthsShort[last.getMonth()]} ${last.getFullYear()}`;
  }, [viewMode, selectedDate, weekDays, isEn]);

  const hoursList = useMemo(
    () => Array.from({ length: GRID_END_HOUR - GRID_START_HOUR }, (_, i) => GRID_START_HOUR + i),
    []
  );

  const getEventCardClasses = (kind: CalendarEventKind) => {
    switch (kind) {
      case 'confirmed':
        return 'bg-sky-50/95 hover:bg-sky-100/95 border-sky-200 text-sky-950 dark:bg-sky-950/75 dark:hover:bg-sky-900/80 dark:border-sky-800/80 dark:text-sky-100';
      case 'pending':
        return 'bg-amber-50/95 hover:bg-amber-100/95 border-amber-200 text-amber-950 dark:bg-amber-950/70 dark:hover:bg-amber-900/75 dark:border-amber-800/80 dark:text-amber-100';
      case 'open_slot':
        return 'bg-teal-50/95 hover:bg-teal-100/95 border-teal-200 text-teal-950 dark:bg-teal-950/75 dark:hover:bg-teal-900/80 dark:border-teal-800/80 dark:text-teal-100';
      case 'completed':
      default:
        return 'bg-indigo-50/95 hover:bg-indigo-100/95 border-indigo-200 text-indigo-950 dark:bg-indigo-950/70 dark:hover:bg-indigo-900/75 dark:border-indigo-800/80 dark:text-indigo-100';
    }
  };

  const getKindLabel = (kind: CalendarEventKind) => {
    if (isEn) {
      return kind === 'confirmed'
        ? 'Confirmed'
        : kind === 'pending'
        ? 'Pending'
        : kind === 'open_slot'
        ? 'Open Slot'
        : 'Completed';
    }
    return kind === 'confirmed'
      ? 'Disahkan'
      : kind === 'pending'
      ? 'Menunggu'
      : kind === 'open_slot'
      ? 'Slot Terbuka'
      : 'Selesai';
  };

  const reminderVisuals = useMemo(() => {
    if (!activeReminder?.registration) return null;
    const reg = activeReminder.registration;
    return resolveMenteeVisuals(
      {
        applicantId: reg.applicantId,
        entrepreneurName: reg.entrepreneurName,
        businessName: reg.businessName,
        category: reg.businessCategory
      },
      businesses
    );
  }, [activeReminder, businesses]);

  return (
    <div key="schedule" className="space-y-4 animate-dashboard-tab">
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* =================================================================== */}
        {/* LEFT UTILITY COLUMN (Mini Calendar + Reminder + Filters + Tracks)   */}
        {/* =================================================================== */}
        <aside className="w-full lg:w-[276px] xl:w-[292px] shrink-0 space-y-3.5">
          {/* 1. MINI MONTHLY CALENDAR */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                {(isEn ? EN_MONTHS_FULL : MALAY_MONTHS_FULL)[miniMonthDate.getMonth()]}{' '}
                {miniMonthDate.getFullYear()}
              </h3>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setMiniMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                  }
                  aria-label={isEn ? 'Previous month' : 'Bulan sebelumnya'}
                  className="p-1.5 rounded-lg text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setMiniMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                  }
                  aria-label={isEn ? 'Next month' : 'Bulan seterusnya'}
                  className="p-1.5 rounded-lg text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-y-1 text-center">
              {(isEn ? EN_WEEKDAYS_INITIALS : MALAY_WEEKDAYS_INITIALS).map((dayChar, idx) => (
                <div
                  key={idx}
                  className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 py-1"
                >
                  {dayChar}
                </div>
              ))}
              {miniCalendarDays.map((cell) => {
                const isSelected = cell.iso === selectedDateIso;
                const isToday = cell.iso === todayIso;
                const hasEvents = eventDateSet.has(cell.iso);
                return (
                  <button
                    key={cell.iso}
                    type="button"
                    onClick={() => handleJumpToDate(cell.date)}
                    className={`relative mx-auto w-8 h-8 rounded-full text-xs font-semibold tabular-nums flex flex-col items-center justify-center transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-teal-700 text-white dark:bg-teal-500 dark:text-slate-950 font-bold'
                        : isToday
                        ? 'ring-1 ring-teal-600/70 dark:ring-teal-400/70 text-teal-800 dark:text-teal-300 bg-teal-50/70 dark:bg-teal-950/40'
                        : cell.inCurrentMonth
                        ? 'text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800'
                        : 'text-slate-300 dark:text-zinc-600 hover:bg-slate-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <span>{cell.date.getDate()}</span>
                    {hasEvents && !isSelected && (
                      <span
                        aria-hidden="true"
                        className="absolute bottom-1 w-2.5 h-0.5 rounded-full bg-teal-600 dark:bg-teal-400"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. FEATURED TEAL REMINDER CARD (Peringatan Temu Janji) */}
          <div className="bg-teal-800 dark:bg-teal-900/95 text-white rounded-2xl border border-teal-700/80 dark:border-teal-700/60 p-4 shadow-xs space-y-3">
            {activeReminder ? (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-teal-100/85">
                      {isEn ? 'Appointment Reminder' : 'Peringatan Temu Janji'}
                    </p>
                    <h4 className="text-base font-bold text-white leading-snug mt-0.5 truncate">
                      {activeReminder.title}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleJumpToDate(activeReminder.dateObj)}
                    className="text-[11px] font-semibold text-teal-100 hover:text-white underline underline-offset-2 shrink-0 cursor-pointer"
                  >
                    {isEn ? 'Go' : 'Lihat'}
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-teal-50/95 tabular-nums">
                  <Clock className="w-3.5 h-3.5 shrink-0 text-teal-200" />
                  <span className="truncate">
                    {activeReminder.dateObj.getDate()}{' '}
                    {(isEn ? EN_MONTHS_SHORT : MALAY_MONTHS_SHORT)[activeReminder.dateObj.getMonth()]}{' '}
                    &middot; {activeReminder.timeLabel}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2 min-w-0">
                    {reminderVisuals && (
                      <div className="flex -space-x-2 shrink-0">
                        <div className="w-7 h-7 rounded-full overflow-hidden ring-2 ring-teal-800 bg-teal-700">
                          <PortalImage
                            src={reminderVisuals.businessUrl}
                            alt={activeReminder.title}
                            fallbackType="business"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {currentMentor.avatarUrl && (
                          <img
                            src={currentMentor.avatarUrl}
                            alt={currentMentor.name}
                            referrerPolicy="no-referrer"
                            className="w-7 h-7 rounded-full object-cover ring-2 ring-teal-800 bg-teal-700"
                          />
                        )}
                      </div>
                    )}
                    <span className="text-xs text-teal-100/90 truncate">
                      {activeReminder.registration?.entrepreneurName || activeReminder.subtitle}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setDismissedReminderIds((prev) => [...prev, activeReminder.id])}
                      title={isEn ? 'Dismiss reminder' : 'Tutup peringatan ini'}
                      aria-label={isEn ? 'Dismiss reminder' : 'Tutup peringatan'}
                      className="w-8 h-8 rounded-full bg-amber-300 hover:bg-amber-200 text-slate-950 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (activeReminder.registration && activeReminder.kind === 'pending') {
                          onStatusChange(activeReminder.registration, 'confirmed');
                        } else {
                          handleJumpToDate(activeReminder.dateObj);
                          setSelectedEvent(activeReminder);
                        }
                      }}
                      title={
                        activeReminder.kind === 'pending'
                          ? isEn
                            ? 'Confirm session'
                            : 'Sahkan sesi ini'
                          : isEn
                          ? 'Open details'
                          : 'Buka butiran sesi'
                      }
                      aria-label={isEn ? 'Confirm or open reminder' : 'Sahkan atau buka butiran'}
                      className="w-8 h-8 rounded-full bg-teal-950/90 hover:bg-slate-950 text-white border border-teal-600/60 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-teal-100/85">
                  {isEn ? 'Appointment Reminder' : 'Peringatan Temu Janji'}
                </p>
                <p className="text-sm font-bold text-white">
                  {isEn ? 'All caught up on reminders' : 'Tiada peringatan temu janji tertunda'}
                </p>
                {dismissedReminderIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setDismissedReminderIds([])}
                    className="text-xs font-semibold text-amber-200 hover:text-amber-100 underline underline-offset-2 cursor-pointer"
                  >
                    {isEn ? 'Restore reminders' : 'Papar semula peringatan'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 3. COLLAPSIBLE FILTERS CARD (Penapis) */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 p-4 shadow-2xs">
            <button
              type="button"
              onClick={() => setIsFiltersOpen((prev) => !prev)}
              className="w-full flex items-center justify-between text-sm font-bold text-slate-900 dark:text-white cursor-pointer"
            >
              <span>{isEn ? 'Filters' : 'Penapis'}</span>
              <ChevronDown
                className={`w-4 h-4 text-slate-500 dark:text-zinc-400 transition-transform duration-150 ${
                  isFiltersOpen ? 'rotate-0' : '-rotate-90'
                }`}
              />
            </button>

            {isFiltersOpen && (
              <div className="mt-3 space-y-2.5 text-sm">
                {(
                  [
                    {
                      key: 'confirmed' as CalendarEventKind,
                      label: isEn ? 'Confirmed Sessions' : 'Disahkan',
                      accent: 'accent-sky-600'
                    },
                    {
                      key: 'pending' as CalendarEventKind,
                      label: isEn ? 'Pending Approval' : 'Menunggu Kelulusan',
                      accent: 'accent-amber-600'
                    },
                    {
                      key: 'open_slot' as CalendarEventKind,
                      label: isEn ? 'Published Open Slots' : 'Slot Terbuka Mentor',
                      accent: 'accent-teal-700'
                    },
                    {
                      key: 'completed' as CalendarEventKind,
                      label: isEn ? 'Completed' : 'Selesai',
                      accent: 'accent-indigo-600'
                    }
                  ] as const
                ).map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center gap-2.5 text-slate-700 dark:text-zinc-200 cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={statusFilters[item.key]}
                      onChange={() =>
                        setStatusFilters((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
                      }
                      className={`w-4 h-4 rounded border-slate-300 dark:border-zinc-600 ${item.accent} cursor-pointer`}
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 4. COLLAPSIBLE OTHER CALENDARS / CHANNELS CARD (Kalendar Lain) */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 p-4 shadow-2xs">
            <button
              type="button"
              onClick={() => setIsOtherCalendarsOpen((prev) => !prev)}
              className="w-full flex items-center justify-between text-sm font-bold text-slate-900 dark:text-white cursor-pointer"
            >
              <span>{isEn ? 'Session Channels' : 'Kalendar Lain'}</span>
              <ChevronDown
                className={`w-4 h-4 text-slate-500 dark:text-zinc-400 transition-transform duration-150 ${
                  isOtherCalendarsOpen ? 'rotate-0' : '-rotate-90'
                }`}
              />
            </button>

            {isOtherCalendarsOpen && (
              <div className="mt-3 space-y-2.5 text-sm">
                <label className="flex items-center gap-2.5 text-slate-700 dark:text-zinc-200 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={modeFilters.googleMeet}
                    onChange={() =>
                      setModeFilters((prev) => ({ ...prev, googleMeet: !prev.googleMeet }))
                    }
                    className="w-4 h-4 rounded border-slate-300 dark:border-zinc-600 accent-teal-700 cursor-pointer"
                  />
                  <span>Google Meet</span>
                </label>

                <label className="flex items-center gap-2.5 text-slate-700 dark:text-zinc-200 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={modeFilters.inPerson}
                    onChange={() =>
                      setModeFilters((prev) => ({ ...prev, inPerson: !prev.inPerson }))
                    }
                    className="w-4 h-4 rounded border-slate-300 dark:border-zinc-600 accent-teal-700 cursor-pointer"
                  />
                  <span>{isEn ? 'In-Person (Hab Usahawan)' : 'Bersemuka di Hab Usahawan'}</span>
                </label>
              </div>
            )}
          </div>
        </aside>

        {/* =================================================================== */}
        {/* RIGHT MAIN CALENDAR WORKSPACE                                       */}
        {/* =================================================================== */}
        <section className="flex-1 min-w-0 w-full bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-2xs overflow-hidden">
          {/* Calendar Top Toolbar */}
          <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200 dark:border-zinc-700 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => navigatePeriod(-1)}
                  aria-label={isEn ? 'Previous period' : 'Tempoh sebelumnya'}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigatePeriod(1)}
                  aria-label={isEn ? 'Next period' : 'Tempoh seterusnya'}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums px-1">
                {toolbarRangeTitle}
              </h3>

              <button
                type="button"
                onClick={handleJumpToday}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-bold text-slate-800 dark:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors whitespace-nowrap cursor-pointer"
              >
                {isEn ? 'Today' : 'Hari Ini'}
              </button>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Daily / Weekly / Monthly Switcher */}
              <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                {(
                  [
                    { id: 'daily' as CalendarViewMode, label: isEn ? 'Daily' : 'Harian' },
                    { id: 'weekly' as CalendarViewMode, label: isEn ? 'Weekly' : 'Mingguan' },
                    { id: 'monthly' as CalendarViewMode, label: isEn ? 'Monthly' : 'Bulanan' }
                  ] as const
                ).map((modeTab) => {
                  const active = viewMode === modeTab.id;
                  return (
                    <button
                      key={modeTab.id}
                      type="button"
                      onClick={() => setViewMode(modeTab.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                        active
                          ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {modeTab.label}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() =>
                  onOpenCreateSlotModal(formatDateToMalayDay(selectedDate), '10:00 AM - 11:00 AM')
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white shadow-xs transition-colors whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isEn ? 'Create Slot' : 'Cipta Slot'}</span>
              </button>
            </div>
          </div>

          {/* ================================================================= */}
          {/* VIEW 1: WEEKLY TIME GRID (Default Google Calendar style)          */}
          {/* ================================================================= */}
          {viewMode === 'weekly' && (
            <div className="overflow-x-auto">
              <div className="min-w-[760px]">
                {/* Day Header Row */}
                <div className="grid grid-cols-[68px_repeat(7,minmax(0,1fr))] border-b border-slate-200 dark:border-zinc-700 bg-slate-50/70 dark:bg-zinc-950/50">
                  <div className="py-3 px-2 text-[11px] font-bold text-slate-500 dark:text-zinc-400 flex items-end justify-center tabular-nums">
                    GMT+08
                  </div>
                  {weekDays.map((dayDt) => {
                    const dayIso = toLocalIsoDate(dayDt);
                    const isSelectedDay = dayIso === selectedDateIso;
                    const isTodayDay = dayIso === todayIso;
                    const dayName = (isEn ? EN_WEEKDAYS_FULL : MALAY_WEEKDAYS_FULL)[dayDt.getDay()];
                    return (
                      <button
                        key={dayIso}
                        type="button"
                        onClick={() => setSelectedDate(dayDt)}
                        className={`py-2.5 px-2 border-l border-slate-200 dark:border-zinc-700 text-center transition-colors cursor-pointer ${
                          isSelectedDay
                            ? 'bg-teal-50/90 dark:bg-teal-950/45'
                            : 'hover:bg-slate-100/70 dark:hover:bg-zinc-800/50'
                        }`}
                      >
                        <div
                          className={`text-[11px] font-semibold ${
                            isSelectedDay || isTodayDay
                              ? 'text-teal-700 dark:text-teal-300'
                              : 'text-slate-500 dark:text-zinc-400'
                          }`}
                        >
                          {dayName}
                        </div>
                        <div
                          className={`mt-0.5 text-lg font-extrabold tabular-nums leading-tight ${
                            isTodayDay
                              ? 'inline-flex items-center justify-center w-8 h-8 rounded-full bg-teal-700 text-white dark:bg-teal-500 dark:text-slate-950'
                              : isSelectedDay
                              ? 'text-teal-900 dark:text-teal-200'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {dayDt.getDate()}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Scrollable Hourly Body */}
                <div className="relative grid grid-cols-[68px_repeat(7,minmax(0,1fr))]">
                  {/* Time Axis */}
                  <div className="bg-white dark:bg-zinc-900">
                    {hoursList.map((hour) => (
                      <div
                        key={hour}
                        style={{ height: HOUR_ROW_HEIGHT }}
                        className="pr-2.5 pt-1 text-right text-[11px] font-semibold text-slate-400 dark:text-zinc-500 tabular-nums border-b border-slate-100 dark:border-zinc-800/80"
                      >
                        {formatHourLabel24h(hour)}
                      </div>
                    ))}
                  </div>

                  {/* 7 Day Columns */}
                  {weekDays.map((dayDt) => {
                    const dayIso = toLocalIsoDate(dayDt);
                    const isSelectedDay = dayIso === selectedDateIso;
                    const dayEvents = eventsByDateIso[dayIso] || [];
                    const positioned = layoutDayEvents(dayEvents);

                    return (
                      <div
                        key={dayIso}
                        className={`relative border-l border-slate-200 dark:border-zinc-700 ${
                          isSelectedDay ? 'bg-teal-50/35 dark:bg-teal-950/15' : ''
                        }`}
                      >
                        {hoursList.map((hour) => (
                          <button
                            key={hour}
                            type="button"
                            onClick={() => {
                              setSelectedDate(dayDt);
                              onOpenCreateSlotModal(
                                formatDateToMalayDay(dayDt),
                                formatHourRangeForSlotModal(hour)
                              );
                            }}
                            style={{ height: HOUR_ROW_HEIGHT }}
                            aria-label={`${
                              isEn ? 'Create slot on' : 'Cipta slot pada'
                            } ${formatDateToMalayDay(dayDt)} ${formatHourLabel24h(hour)}`}
                            className="group w-full block border-b border-slate-100 dark:border-zinc-800/80 hover:bg-teal-50/50 dark:hover:bg-teal-950/30 transition-colors text-left cursor-pointer relative"
                          >
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-1.5 top-1 text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-white/90 dark:bg-zinc-900/90 px-1.5 py-0.5 rounded-md border border-teal-200 dark:border-teal-800">
                              + Slot
                            </span>
                          </button>
                        ))}

                        {/* Positioned Event Cards */}
                        {positioned.map(({ event, colIndex, totalCols }) => {
                          const clampedStart = Math.max(
                            GRID_START_HOUR * 60,
                            Math.min(event.startMins, GRID_END_HOUR * 60 - 30)
                          );
                          const clampedEnd = Math.min(
                            GRID_END_HOUR * 60,
                            Math.max(event.endMins, clampedStart + 45)
                          );
                          const topPx = ((clampedStart - GRID_START_HOUR * 60) / 60) * HOUR_ROW_HEIGHT + 2;
                          const heightPx = Math.max(
                            46,
                            ((clampedEnd - clampedStart) / 60) * HOUR_ROW_HEIGHT - 4
                          );
                          const widthPct = 100 / totalCols;
                          const leftPct = colIndex * widthPct;

                          return (
                            <button
                              key={event.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEvent(event);
                              }}
                              style={{
                                top: `${topPx}px`,
                                height: `${heightPx}px`,
                                left: `calc(${leftPct}% + 3px)`,
                                width: `calc(${widthPct}% - 6px)`
                              }}
                              className={`absolute z-10 rounded-xl border p-2 text-left shadow-2xs transition-transform duration-150 hover:scale-[1.01] overflow-hidden cursor-pointer flex flex-col justify-between ${getEventCardClasses(
                                event.kind
                              )}`}
                            >
                              <div className="min-w-0">
                                <div className="text-xs font-extrabold leading-tight truncate">
                                  {event.title}
                                </div>
                                <div className="text-[11px] opacity-80 truncate mt-0.5">
                                  {event.mode === 'Google Meet' ? 'Google Meet' : getKindLabel(event.kind)}
                                </div>
                              </div>
                              <div className="text-[10px] font-semibold tabular-nums opacity-85 truncate flex items-center gap-1">
                                <Clock className="w-3 h-3 shrink-0" />
                                <span className="truncate">{event.timeLabel}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* VIEW 2: DAILY TIME GRID                                           */}
          {/* ================================================================= */}
          {viewMode === 'daily' && (() => {
            const dayEvents = eventsByDateIso[selectedDateIso] || [];
            const positioned = layoutDayEvents(dayEvents);
            const dayName = (isEn ? EN_WEEKDAYS_FULL : MALAY_WEEKDAYS_FULL)[selectedDate.getDay()];

            return (
              <div>
                <div className="grid grid-cols-[72px_1fr] border-b border-slate-200 dark:border-zinc-700 bg-teal-50/60 dark:bg-teal-950/30">
                  <div className="py-3 px-2 text-[11px] font-bold text-slate-500 dark:text-zinc-400 flex items-end justify-center tabular-nums">
                    GMT+08
                  </div>
                  <div className="py-3 px-4 border-l border-slate-200 dark:border-zinc-700 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold text-teal-700 dark:text-teal-300">
                        {dayName}
                      </div>
                      <div className="text-xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                        {selectedDate.getDate()}{' '}
                        {(isEn ? EN_MONTHS_FULL : MALAY_MONTHS_FULL)[selectedDate.getMonth()]}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-600 dark:text-zinc-300 tabular-nums">
                      {dayEvents.length} {isEn ? 'scheduled items' : 'jadual sesi'}
                    </span>
                  </div>
                </div>

                <div className="relative grid grid-cols-[72px_1fr]">
                  <div className="bg-white dark:bg-zinc-900">
                    {hoursList.map((hour) => (
                      <div
                        key={hour}
                        style={{ height: HOUR_ROW_HEIGHT }}
                        className="pr-3 pt-1.5 text-right text-xs font-semibold text-slate-400 dark:text-zinc-500 tabular-nums border-b border-slate-100 dark:border-zinc-800/80"
                      >
                        {formatHourLabel24h(hour)}
                      </div>
                    ))}
                  </div>

                  <div className="relative border-l border-slate-200 dark:border-zinc-700">
                    {hoursList.map((hour) => (
                      <button
                        key={hour}
                        type="button"
                        onClick={() =>
                          onOpenCreateSlotModal(
                            formatDateToMalayDay(selectedDate),
                            formatHourRangeForSlotModal(hour)
                          )
                        }
                        style={{ height: HOUR_ROW_HEIGHT }}
                        className="group w-full block border-b border-slate-100 dark:border-zinc-800/80 hover:bg-teal-50/45 dark:hover:bg-teal-950/25 transition-colors text-left relative cursor-pointer"
                      >
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-3 top-2 text-xs font-bold text-teal-700 dark:text-teal-300">
                          + {isEn ? 'Add slot at this hour' : 'Cipta slot pada jam ini'}
                        </span>
                      </button>
                    ))}

                    {positioned.map(({ event, colIndex, totalCols }) => {
                      const clampedStart = Math.max(
                        GRID_START_HOUR * 60,
                        Math.min(event.startMins, GRID_END_HOUR * 60 - 30)
                      );
                      const clampedEnd = Math.min(
                        GRID_END_HOUR * 60,
                        Math.max(event.endMins, clampedStart + 50)
                      );
                      const topPx = ((clampedStart - GRID_START_HOUR * 60) / 60) * HOUR_ROW_HEIGHT + 3;
                      const heightPx = Math.max(
                        54,
                        ((clampedEnd - clampedStart) / 60) * HOUR_ROW_HEIGHT - 6
                      );
                      const widthPct = 100 / totalCols;
                      const leftPct = colIndex * widthPct;

                      return (
                        <button
                          key={event.id}
                          type="button"
                          onClick={() => setSelectedEvent(event)}
                          style={{
                            top: `${topPx}px`,
                            height: `${heightPx}px`,
                            left: `calc(${leftPct}% + 6px)`,
                            width: `calc(${widthPct}% - 12px)`
                          }}
                          className={`absolute z-10 rounded-xl border px-3.5 py-2.5 text-left shadow-2xs transition-transform duration-150 hover:scale-[1.005] cursor-pointer flex items-center justify-between gap-3 ${getEventCardClasses(
                            event.kind
                          )}`}
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-extrabold truncate">{event.title}</div>
                            <div className="text-xs opacity-80 truncate">{event.subtitle}</div>
                          </div>
                          <div className="text-right shrink-0 tabular-nums">
                            <div className="text-xs font-bold">{event.timeLabel}</div>
                            <div className="text-[11px] opacity-80">
                              {event.mode === 'Google Meet'
                                ? 'Google Meet'
                                : isEn
                                ? 'Entrepreneur Hub'
                                : 'Hab Usahawan'}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ================================================================= */}
          {/* VIEW 3: MONTHLY GRID                                              */}
          {/* ================================================================= */}
          {viewMode === 'monthly' && (
            <div>
              <div className="grid grid-cols-7 border-b border-slate-200 dark:border-zinc-700 bg-slate-50/70 dark:bg-zinc-950/50">
                {(isEn ? EN_WEEKDAYS_FULL : MALAY_WEEKDAYS_FULL).map((dayName) => (
                  <div
                    key={dayName}
                    className="py-2.5 px-2 text-center text-xs font-bold text-slate-600 dark:text-zinc-300 border-l first:border-l-0 border-slate-200 dark:border-zinc-700"
                  >
                    {dayName}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {mainMonthDays.map((cell) => {
                  const cellEvents = eventsByDateIso[cell.iso] || [];
                  const isSelected = cell.iso === selectedDateIso;
                  const isToday = cell.iso === todayIso;
                  return (
                    <div
                      key={cell.iso}
                      onClick={() => {
                        setSelectedDate(cell.date);
                        onOpenCreateSlotModal(formatDateToMalayDay(cell.date), '10:00 AM - 11:00 AM');
                      }}
                      className={`min-h-[108px] p-2 border-b border-l first:border-l-0 border-slate-200 dark:border-zinc-700 transition-colors cursor-pointer flex flex-col gap-1 ${
                        isSelected
                          ? 'bg-teal-50/50 dark:bg-teal-950/25'
                          : cell.inCurrentMonth
                          ? 'bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800/60'
                          : 'bg-slate-50/60 dark:bg-zinc-950/50 text-slate-400 dark:text-zinc-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold tabular-nums w-6 h-6 rounded-full inline-flex items-center justify-center ${
                            isToday
                              ? 'bg-teal-700 text-white dark:bg-teal-500 dark:text-slate-950'
                              : isSelected
                              ? 'bg-teal-100 text-teal-900 dark:bg-teal-900/60 dark:text-teal-200'
                              : cell.inCurrentMonth
                              ? 'text-slate-800 dark:text-zinc-200'
                              : 'text-slate-400 dark:text-zinc-600'
                          }`}
                        >
                          {cell.date.getDate()}
                        </span>
                        {cellEvents.length > 0 && (
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 tabular-nums">
                            {cellEvents.length}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        {cellEvents.slice(0, 3).map((ev) => (
                          <button
                            key={ev.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDate(cell.date);
                              setSelectedEvent(ev);
                            }}
                            className={`w-full text-left px-1.5 py-1 rounded-md border text-[11px] font-bold truncate cursor-pointer ${getEventCardClasses(
                              ev.kind
                            )}`}
                          >
                            {formatHourMinutes12h(ev.startMins, isEn)} · {ev.title}
                          </button>
                        ))}
                        {cellEvents.length > 3 && (
                          <div className="text-[10px] font-bold text-teal-700 dark:text-teal-300 px-1">
                            +{cellEvents.length - 3} {isEn ? 'more' : 'lagi'}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ===================================================================== */}
      {/* MODAL: BUTIRAN TEMU JANJI ATAU SLOT TERBUKA                           */}
      {/* ===================================================================== */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-700 overflow-hidden max-h-[90vh] overflow-y-auto">
            {selectedEvent.registration ? (
              (() => {
                const reg = selectedEvent.registration;
                const rawPhone = reg.entrepreneurPhone || '';
                const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
                const visuals = resolveMenteeVisuals(
                  {
                    applicantId: reg.applicantId,
                    entrepreneurName: reg.entrepreneurName,
                    businessName: reg.businessName,
                    category: reg.businessCategory
                  },
                  businesses
                );

                return (
                  <>
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-700 flex items-start justify-between gap-4 bg-slate-50/70 dark:bg-zinc-950/60">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 shrink-0">
                          <PortalImage
                            src={visuals.businessUrl}
                            alt={reg.businessName}
                            fallbackType="business"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-teal-700 dark:text-teal-400">
                            {getKindLabel(selectedEvent.kind)} &middot; {reg.district || 'Kelantan'}
                          </div>
                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                            {reg.businessName}
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-zinc-300 truncate">
                            {reg.entrepreneurName}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedEvent(null)}
                        aria-label={isEn ? 'Close modal' : 'Tutup'}
                        className="p-1.5 rounded-lg text-slate-500 dark:text-zinc-400 hover:bg-slate-200/70 dark:hover:bg-zinc-800 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-6 space-y-4 text-sm">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-950/70 border border-slate-200 dark:border-zinc-800">
                        <div className="flex items-center gap-2 text-slate-800 dark:text-zinc-200">
                          <Calendar className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
                          <span className="font-semibold tabular-nums">
                            {reg.preferredDate || selectedEvent.dateIso}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-800 dark:text-zinc-200">
                          <Clock className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
                          <span className="font-semibold tabular-nums">{selectedEvent.timeLabel}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-800 dark:text-zinc-200 sm:col-span-2">
                          {selectedEvent.mode === 'Google Meet' ? (
                            <Video className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                          ) : (
                            <MapPin className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
                          )}
                          <span className="font-semibold">
                            {selectedEvent.mode === 'Google Meet'
                              ? 'Google Meet'
                              : isEn
                              ? 'Entrepreneur Hub Mentoring Room'
                              : 'Bilik Bimbingan Hab Usahawan KBelia'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1">
                          {isEn ? 'Session Topic' : 'Topik Perbincangan'}
                        </div>
                        <p className="font-bold text-slate-900 dark:text-white">{reg.topic}</p>
                      </div>

                      {reg.challenges && (
                        <div>
                          <div className="text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1">
                            {isEn ? 'Entrepreneur Notes' : 'Cabaran & Mesej Usahawan'}
                          </div>
                          <p className="text-slate-700 dark:text-zinc-300 leading-relaxed bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-xl border border-slate-200 dark:border-zinc-800">
                            &ldquo;{reg.challenges}&rdquo;
                          </p>
                        </div>
                      )}

                      {reg.meetingLink && (
                        <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/70">
                          <a
                            href={reg.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-sky-800 dark:text-sky-300 hover:underline flex items-center gap-1.5 truncate"
                          >
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{reg.meetingLink}</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(reg.meetingLink || '');
                              triggerToast(
                                isEn ? 'Google Meet link copied.' : 'Pautan Google Meet disalin.',
                                'success'
                              );
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-zinc-900 border border-sky-200 dark:border-sky-700 text-slate-800 dark:text-zinc-200 flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{isEn ? 'Copy' : 'Salin'}</span>
                          </button>
                        </div>
                      )}

                      <div className="pt-3 border-t border-slate-200 dark:border-zinc-700 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {cleanPhone && (
                            <a
                              href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                                `Salam ${reg.entrepreneurName}, saya ${currentMentor.name} dari Hab Usahawan KBelia.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 flex items-center gap-1.5 cursor-pointer"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedEvent(null);
                              onOpenNotesModal(reg);
                            }}
                            className="px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-zinc-800 text-slate-900 dark:text-white border border-slate-300 dark:border-zinc-600 hover:bg-slate-50 dark:hover:bg-zinc-700 flex items-center gap-1.5 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>{isEn ? 'Notes & Meet Link' : 'Nota & Pautan Meet'}</span>
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {reg.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  onStatusChange(reg, 'cancelled');
                                  setSelectedEvent(null);
                                }}
                                className="px-3 py-2 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/60 flex items-center gap-1 cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>{isEn ? 'Decline' : 'Tolak'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  onStatusChange(reg, 'confirmed');
                                  setSelectedEvent(null);
                                }}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 flex items-center gap-1.5 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{isEn ? 'Confirm Session' : 'Sahkan Sesi'}</span>
                              </button>
                            </>
                          )}

                          {reg.status === 'confirmed' && (
                            <button
                              type="button"
                              onClick={() => {
                                onStatusChange(reg, 'completed');
                                setSelectedEvent(null);
                              }}
                              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{isEn ? 'Mark Completed' : 'Tandakan Selesai'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()
            ) : selectedEvent.slot ? (
              <>
                <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-700 flex items-center justify-between bg-teal-50/70 dark:bg-teal-950/40">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-teal-700 text-white flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {isEn ? 'Published Open Slot' : 'Slot Jadual Terbuka Mentor'}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-zinc-300">
                        {isEn
                          ? 'Visible to youth entrepreneurs for booking.'
                          : 'Sedia ditempah oleh usahawan belia di portal.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedEvent(null)}
                    aria-label={isEn ? 'Close modal' : 'Tutup'}
                    className="p-1.5 rounded-lg text-slate-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-6 space-y-4 text-sm">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950/70 border border-slate-200 dark:border-zinc-800 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                      <Calendar className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                      <span>{selectedEvent.slot.date}</span>
                    </div>
                    <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-zinc-200 tabular-nums">
                      <Clock className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                      <span>{selectedEvent.slot.time}</span>
                    </div>
                    <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-zinc-200">
                      {selectedEvent.mode === 'Google Meet' ? (
                        <Video className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      ) : (
                        <MapPin className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                      )}
                      <span>
                        {selectedEvent.mode === 'Google Meet'
                          ? 'Google Meet'
                          : isEn
                          ? 'Entrepreneur Hub Mentoring Room'
                          : 'Bersemuka di Hab Usahawan KBelia'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-zinc-700">
                    <button
                      type="button"
                      onClick={() => setSelectedEvent(null)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                    >
                      {isEn ? 'Close' : 'Tutup'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const slotId = selectedEvent.slot!.id;
                        setSelectedEvent(null);
                        onDeletePublishedSlot(slotId);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isEn ? 'Remove Slot' : 'Padam Slot'}</span>
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
