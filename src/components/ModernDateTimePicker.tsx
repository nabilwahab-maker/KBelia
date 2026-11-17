import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  X
} from 'lucide-react';

const MALAY_MONTHS = [
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

const MALAY_MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mac',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Ogo',
  'Sep',
  'Okt',
  'Nov',
  'Dis'
];

const EN_MONTHS = [
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

const MALAY_DAYS_FULL = [
  'Ahad',
  'Isnin',
  'Selasa',
  'Rabu',
  'Khamis',
  'Jumaat',
  'Sabtu'
];

const EN_DAYS_FULL = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

const MALAY_WEEKDAYS_SHORT = ['Ah', 'Is', 'Se', 'Ra', 'Kh', 'Ju', 'Sa'];
const EN_WEEKDAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const MONTH_NAME_MAP: Record<string, number> = {
  januari: 0,
  january: 0,
  jan: 0,
  februari: 1,
  february: 1,
  feb: 1,
  mac: 2,
  march: 2,
  mar: 2,
  april: 3,
  apr: 3,
  mei: 4,
  may: 4,
  jun: 5,
  june: 5,
  julai: 6,
  july: 6,
  jul: 6,
  ogos: 7,
  august: 7,
  aug: 7,
  ogo: 7,
  september: 8,
  sep: 8,
  sept: 8,
  oktober: 9,
  october: 9,
  okt: 9,
  oct: 9,
  november: 10,
  nov: 10,
  disember: 11,
  december: 11,
  dis: 11,
  dec: 11
};

export const toLocalIsoDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const parseIsoToDate = (iso: string): Date | null => {
  const m = iso.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0, 0);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const addDaysIso = (iso: string, days: number): string => {
  const d = parseIsoToDate(iso) || new Date();
  d.setDate(d.getDate() + days);
  return toLocalIsoDate(d);
};

export const parseDateValueToRange = (
  raw?: string
): { startIso: string | null; endIso: string | null; isRange: boolean } => {
  if (!raw || !raw.trim()) return { startIso: null, endIso: null, isRange: false };
  const cleaned = raw.trim().replace(/\([^)]*\)/g, '').trim();

  // ISO single date: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return { startIso: cleaned, endIso: null, isRange: false };
  }

  // ISO range: YYYY-MM-DD - YYYY-MM-DD
  const isoRangeMatch = cleaned.match(/^(\d{4}-\d{2}-\d{2})\s*[-–]\s*(\d{4}-\d{2}-\d{2})$/);
  if (isoRangeMatch) {
    return { startIso: isoRangeMatch[1], endIso: isoRangeMatch[2], isRange: true };
  }

  // Range with same month/year: "12 - 14 Ogos 2026" or "12–14 Mac 2026"
  const sameMonthRange = cleaned.match(/^(\d{1,2})\s*[-–]\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (sameMonthRange) {
    const mon = MONTH_NAME_MAP[sameMonthRange[3].toLowerCase()];
    if (mon !== undefined) {
      const y = Number(sameMonthRange[4]);
      const d1 = toLocalIsoDate(new Date(y, mon, Number(sameMonthRange[1]), 12, 0, 0));
      const d2 = toLocalIsoDate(new Date(y, mon, Number(sameMonthRange[2]), 12, 0, 0));
      return { startIso: d1, endIso: d2, isRange: true };
    }
  }

  // Range across months same year: "28 Mac - 2 April 2026"
  const crossMonthRange = cleaned.match(
    /^(\d{1,2})\s+([A-Za-z]+)\s*[-–]\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/
  );
  if (crossMonthRange) {
    const m1 = MONTH_NAME_MAP[crossMonthRange[2].toLowerCase()];
    const m2 = MONTH_NAME_MAP[crossMonthRange[4].toLowerCase()];
    if (m1 !== undefined && m2 !== undefined) {
      const y = Number(crossMonthRange[5]);
      return {
        startIso: toLocalIsoDate(new Date(y, m1, Number(crossMonthRange[1]), 12, 0, 0)),
        endIso: toLocalIsoDate(new Date(y, m2, Number(crossMonthRange[3]), 12, 0, 0)),
        isRange: true
      };
    }
  }

  // Full cross-year range: "28 Dis 2026 - 2 Jan 2027"
  const fullRange = cleaned.match(
    /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\s*[-–]\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/
  );
  if (fullRange) {
    const m1 = MONTH_NAME_MAP[fullRange[2].toLowerCase()];
    const m2 = MONTH_NAME_MAP[fullRange[5].toLowerCase()];
    if (m1 !== undefined && m2 !== undefined) {
      return {
        startIso: toLocalIsoDate(new Date(Number(fullRange[3]), m1, Number(fullRange[1]), 12, 0, 0)),
        endIso: toLocalIsoDate(new Date(Number(fullRange[6]), m2, Number(fullRange[4]), 12, 0, 0)),
        isRange: true
      };
    }
  }

  // Single Malay/English date: "28 Mac 2026" or "25 Disember 2026"
  const singleText = cleaned.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (singleText) {
    const mon = MONTH_NAME_MAP[singleText[2].toLowerCase()];
    if (mon !== undefined) {
      return {
        startIso: toLocalIsoDate(new Date(Number(singleText[3]), mon, Number(singleText[1]), 12, 0, 0)),
        endIso: null,
        isRange: false
      };
    }
  }

  return { startIso: null, endIso: null, isRange: false };
};

export const formatSingleDateHuman = (
  iso: string,
  opts?: { withWeekday?: boolean; shortMonth?: boolean; isEn?: boolean }
): string => {
  const d = parseIsoToDate(iso);
  if (!d) return iso;
  const day = d.getDate();
  const months = opts?.isEn
    ? EN_MONTHS
    : opts?.shortMonth
    ? MALAY_MONTHS_SHORT
    : MALAY_MONTHS;
  const monthName = opts?.isEn && opts?.shortMonth
    ? EN_MONTHS[d.getMonth()].slice(0, 3)
    : months[d.getMonth()];
  const year = d.getFullYear();
  if (opts?.withWeekday) {
    const dayName = opts?.isEn
      ? EN_DAYS_FULL[d.getDay()]
      : MALAY_DAYS_FULL[d.getDay()];
    return `${day} ${monthName} ${year} (${dayName})`;
  }
  return `${day} ${monthName} ${year}`;
};

export const formatDateRangeMalay = (startIso: string, endIso: string, isEn = false): string => {
  const d1 = parseIsoToDate(startIso);
  const d2 = parseIsoToDate(endIso);
  if (!d1 || !d2) return startIso;
  const [first, second] = d1.getTime() <= d2.getTime() ? [d1, d2] : [d2, d1];
  const months = isEn ? EN_MONTHS : MALAY_MONTHS;

  if (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  ) {
    return `${first.getDate()} ${months[first.getMonth()]} ${first.getFullYear()}`;
  }
  if (first.getFullYear() === second.getFullYear() && first.getMonth() === second.getMonth()) {
    return `${first.getDate()} - ${second.getDate()} ${months[first.getMonth()]} ${first.getFullYear()}`;
  }
  if (first.getFullYear() === second.getFullYear()) {
    return `${first.getDate()} ${months[first.getMonth()]} - ${second.getDate()} ${months[second.getMonth()]} ${first.getFullYear()}`;
  }
  return `${first.getDate()} ${months[first.getMonth()]} ${first.getFullYear()} - ${second.getDate()} ${months[second.getMonth()]} ${second.getFullYear()}`;
};

export type DateValueFormat = 'iso' | 'malay-date' | 'malay-day' | 'program-date';

export interface QuickDateOption {
  label: string;
  value: string;
  subLabel?: string;
}

export interface ModernDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  valueFormat?: DateValueFormat;
  allowRange?: boolean;
  allowOngoingPreset?: boolean;
  minDate?: string;
  quickDates?: QuickDateOption[];
  placeholder?: string;
  disabled?: boolean;
  isEn?: boolean;
  accentColor?: 'blue' | 'teal' | 'indigo';
  className?: string;
  clearable?: boolean;
}

interface PopoverCoords {
  top: number;
  left: number;
  width: number;
  openUpward: boolean;
}

const usePortalPopoverPosition = (
  isOpen: boolean,
  triggerRef: React.RefObject<HTMLButtonElement | null>,
  panelRef: React.RefObject<HTMLDivElement | null>,
  desiredWidth: number,
  estimatedHeight: number
) => {
  const [coords, setCoords] = useState<PopoverCoords | null>(null);

  useLayoutEffect(() => {
    if (!isOpen) {
      setCoords(null);
      return;
    }

    const updatePosition = () => {
      const btn = triggerRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const panelWidth = Math.min(desiredWidth, vw - 16);
      const panelHeight = panelRef.current?.offsetHeight || estimatedHeight;

      const spaceBelow = vh - rect.bottom - 10;
      const spaceAbove = rect.top - 10;
      const openUpward = spaceBelow < panelHeight && spaceAbove > spaceBelow;

      let left = rect.left;
      if (left + panelWidth > vw - 8) {
        left = vw - panelWidth - 8;
      }
      if (left < 8) left = 8;

      const top = openUpward
        ? Math.max(8, rect.top - panelHeight - 6)
        : Math.min(vh - panelHeight - 8, rect.bottom + 6);

      setCoords({
        top: Math.max(8, top),
        left,
        width: panelWidth,
        openUpward
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, triggerRef, panelRef, desiredWidth, estimatedHeight]);

  return coords;
};

export const ModernDatePicker: React.FC<ModernDatePickerProps> = ({
  value,
  onChange,
  valueFormat = 'iso',
  allowRange = false,
  allowOngoingPreset = false,
  minDate,
  quickDates,
  placeholder,
  disabled = false,
  isEn = false,
  accentColor = 'blue',
  className = '',
  clearable = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const parsed = useMemo(() => parseDateValueToRange(value), [value]);
  const [isRangeMode, setIsRangeMode] = useState<boolean>(allowRange && parsed.isRange);
  const [rangeDraftStart, setRangeDraftStart] = useState<string | null>(parsed.startIso);
  const [hoverIso, setHoverIso] = useState<string | null>(null);

  const todayIso = useMemo(() => toLocalIsoDate(new Date()), []);
  const initialDate = useMemo(
    () => parseIsoToDate(parsed.startIso || minDate || todayIso) || new Date(),
    [parsed.startIso, minDate, todayIso]
  );

  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth());

  useEffect(() => {
    if (isOpen) {
      const target = parseIsoToDate(parsed.startIso || minDate || todayIso) || new Date();
      setViewYear(target.getFullYear());
      setViewMonth(target.getMonth());
      setIsRangeMode(allowRange && parsed.isRange);
      setRangeDraftStart(parsed.startIso);
      setHoverIso(null);
    }
  }, [isOpen, parsed.startIso, parsed.isRange, allowRange, minDate, todayIso]);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }
      setIsOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  const coords = usePortalPopoverPosition(isOpen, triggerRef, panelRef, 336, 405);

  const accentClasses =
    accentColor === 'teal'
      ? {
          ring: 'focus:ring-teal-500/30 focus:border-teal-600 dark:focus:border-teal-500',
          selected: 'bg-teal-600 text-white font-bold shadow-xs',
          inRange: 'bg-teal-50 dark:bg-teal-950/60 text-teal-900 dark:text-teal-200',
          todayRing: 'ring-1 ring-teal-500 text-teal-700 dark:text-teal-300 font-bold',
          activeChip: 'bg-teal-600 text-white border-teal-600'
        }
      : accentColor === 'indigo'
      ? {
          ring: 'focus:ring-indigo-500/30 focus:border-indigo-600 dark:focus:border-indigo-500',
          selected: 'bg-indigo-600 text-white font-bold shadow-xs',
          inRange: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200',
          todayRing: 'ring-1 ring-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold',
          activeChip: 'bg-indigo-600 text-white border-indigo-600'
        }
      : {
          ring: 'focus:ring-blue-500/30 focus:border-blue-600 dark:focus:border-blue-500',
          selected: 'bg-blue-600 text-white font-bold shadow-xs',
          inRange: 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200',
          todayRing: 'ring-1 ring-blue-500 text-blue-700 dark:text-blue-300 font-bold',
          activeChip: 'bg-blue-600 text-white border-blue-600'
        };

  const formatOutputSingle = (iso: string): string => {
    if (valueFormat === 'iso') return iso;
    if (valueFormat === 'malay-day') {
      return formatSingleDateHuman(iso, { withWeekday: true, isEn });
    }
    return formatSingleDateHuman(iso, { withWeekday: false, isEn });
  };

  const handleSelectIsoDay = (iso: string) => {
    if (minDate && iso < minDate) return;

    if (allowRange && isRangeMode) {
      if (!rangeDraftStart || (parsed.startIso && parsed.endIso && rangeDraftStart === parsed.startIso)) {
        // Begin a new range
        setRangeDraftStart(iso);
        return;
      }
      const start = rangeDraftStart <= iso ? rangeDraftStart : iso;
      const end = rangeDraftStart <= iso ? iso : rangeDraftStart;
      if (valueFormat === 'iso') {
        onChange(start === end ? start : `${start} - ${end}`);
      } else {
        onChange(formatDateRangeMalay(start, end, isEn));
      }
      setRangeDraftStart(null);
      setIsOpen(false);
      return;
    }

    onChange(formatOutputSingle(iso));
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

    const cells: { iso: string; dayNum: number; inCurrentMonth: boolean }[] = [];

    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const d = new Date(viewYear, viewMonth - 1, dayNum, 12, 0, 0);
      cells.push({ iso: toLocalIsoDate(d), dayNum, inCurrentMonth: false });
    }

    for (let dNum = 1; dNum <= daysInMonth; dNum++) {
      const d = new Date(viewYear, viewMonth, dNum, 12, 0, 0);
      cells.push({ iso: toLocalIsoDate(d), dayNum: dNum, inCurrentMonth: true });
    }

    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(viewYear, viewMonth + 1, i, 12, 0, 0);
      cells.push({ iso: toLocalIsoDate(d), dayNum: i, inCurrentMonth: false });
    }

    return cells;
  }, [viewYear, viewMonth]);

  const displayLabel = useMemo(() => {
    if (!value || !value.trim()) return '';
    if (valueFormat === 'iso' && parsed.startIso) {
      return formatSingleDateHuman(parsed.startIso, { withWeekday: true, shortMonth: true, isEn });
    }
    return value;
  }, [value, valueFormat, parsed.startIso, isEn]);

  const defaultQuickShortcuts: QuickDateOption[] = useMemo(() => {
    if (quickDates && quickDates.length > 0) return quickDates;
    const baseIso = minDate && minDate > todayIso ? minDate : todayIso;
    const items: QuickDateOption[] = [
      {
        label: minDate && minDate > todayIso ? (isEn ? 'Earliest' : 'Terawal') : isEn ? 'Today' : 'Hari Ini',
        value: formatOutputSingle(baseIso)
      },
      {
        label: isEn ? 'Tomorrow' : 'Esok',
        value: formatOutputSingle(addDaysIso(todayIso, 1))
      },
      {
        label: isEn ? 'Next Week' : '+7 Hari',
        value: formatOutputSingle(addDaysIso(todayIso, 7))
      }
    ];
    if (allowOngoingPreset) {
      items.push({
        label: isEn ? 'All Month' : 'Sepanjang Bulan',
        value: isEn ? 'Throughout the Month' : 'Sepanjang Bulan'
      });
    }
    return items;
  }, [quickDates, minDate, todayIso, isEn, allowOngoingPreset, valueFormat]);

  const monthNames = isEn ? EN_MONTHS : MALAY_MONTHS;
  const weekdayHeaders = isEn ? EN_WEEKDAYS_SHORT : MALAY_WEEKDAYS_SHORT;
  const yearOptions = useMemo(() => {
    const base = new Date().getFullYear();
    const list: number[] = [];
    for (let y = base - 2; y <= base + 4; y++) list.push(y);
    if (!list.includes(viewYear)) list.push(viewYear);
    return list.sort((a, b) => a - b);
  }, [viewYear]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border ${
          isOpen
            ? 'border-blue-600 ring-2 ring-blue-500/25 bg-white dark:bg-slate-900'
            : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
        } text-left transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none ${accentClasses.ring} ${className}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Calendar className="w-4 h-4 text-black/65 dark:text-white/70 shrink-0" />
          <span
            className={`truncate tabular-nums ${
              displayLabel
                ? 'font-semibold text-black dark:text-white'
                : 'font-normal text-black/50 dark:text-white/50'
            }`}
          >
            {displayLabel || placeholder || (isEn ? 'Select date' : 'Pilih tarikh')}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-black/55 dark:text-white/60 shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen &&
        coords &&
        createPortal(
          <div
            ref={panelRef}
            style={{ top: coords.top, left: coords.left, width: coords.width }}
            className="fixed z-[9999] bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-600 shadow-2xl p-3.5 space-y-3 animate-in fade-in zoom-in-95 duration-150"
            role="dialog"
            aria-label={isEn ? 'Date picker' : 'Pemilih Tarikh'}
          >
            {/* Optional Single vs Range Mode Toggle */}
            {allowRange && (
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setIsRangeMode(false);
                    setRangeDraftStart(null);
                  }}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    !isRangeMode
                      ? 'bg-white dark:bg-slate-900 text-black dark:text-white shadow-2xs'
                      : 'text-black/65 dark:text-white/65 hover:text-black dark:hover:text-white'
                  }`}
                >
                  {isEn ? 'Single Date' : 'Tarikh Tunggal'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRangeMode(true);
                    setRangeDraftStart(null);
                  }}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    isRangeMode
                      ? 'bg-white dark:bg-slate-900 text-black dark:text-white shadow-2xs'
                      : 'text-black/65 dark:text-white/65 hover:text-black dark:hover:text-white'
                  }`}
                >
                  {isEn ? 'Date Range' : 'Julat Tarikh'}
                </button>
              </div>
            )}

            {/* Quick Shortcuts Strip */}
            {defaultQuickShortcuts.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[0.75rem] font-bold text-black/60 dark:text-white/65 px-0.5">
                  {quickDates && quickDates.length > 0
                    ? isEn
                      ? 'Suggested Available Dates'
                      : 'Cadangan Tarikh Pantas'
                    : isEn
                    ? 'Quick Select'
                    : 'Pintasan Pantas'}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {defaultQuickShortcuts.map((shortcut) => {
                    const isSelected = value === shortcut.value;
                    return (
                      <button
                        key={`${shortcut.label}-${shortcut.value}`}
                        type="button"
                        onClick={() => {
                          onChange(shortcut.value);
                          setRangeDraftStart(null);
                          setIsOpen(false);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                          isSelected
                            ? accentClasses.activeChip
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-black dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {shortcut.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Range helper prompt */}
            {allowRange && isRangeMode && (
              <div className="text-xs font-semibold text-black/75 dark:text-white/80 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5">
                {rangeDraftStart
                  ? isEn
                    ? `Start: ${formatSingleDateHuman(rangeDraftStart, { shortMonth: true, isEn })} — Click end date`
                    : `Mula: ${formatSingleDateHuman(rangeDraftStart, { shortMonth: true })} — Tekan tarikh tamat`
                  : isEn
                  ? 'Click start date on the calendar'
                  : 'Tekan tarikh mula pada kalendar'}
              </div>
            )}

            {/* Month / Year Navigation */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label={isEn ? 'Previous month' : 'Bulan sebelumnya'}
                className="w-9 h-9 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-black dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 flex-1 justify-center">
                <select
                  value={viewMonth}
                  onChange={(e) => setViewMonth(Number(e.target.value))}
                  aria-label={isEn ? 'Month' : 'Bulan'}
                  className="px-2 py-1.5 rounded-lg text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-black dark:text-white cursor-pointer focus:outline-none"
                >
                  {monthNames.map((mName, idx) => (
                    <option key={mName} value={idx}>
                      {mName}
                    </option>
                  ))}
                </select>
                <select
                  value={viewYear}
                  onChange={(e) => setViewYear(Number(e.target.value))}
                  aria-label={isEn ? 'Year' : 'Tahun'}
                  className="px-2 py-1.5 rounded-lg text-sm font-bold tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-black dark:text-white cursor-pointer focus:outline-none"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                aria-label={isEn ? 'Next month' : 'Bulan seterusnya'}
                className="w-9 h-9 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-black dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Weekday Header */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {weekdayHeaders.map((w) => (
                <div
                  key={w}
                  className="py-1 text-xs font-bold text-black/55 dark:text-white/60 uppercase"
                >
                  {w}
                </div>
              ))}
            </div>

            {/* 6-Week Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((cell) => {
                const isDisabled = Boolean(minDate && cell.iso < minDate);
                const isToday = cell.iso === todayIso;

                const activeStart = rangeDraftStart || parsed.startIso;
                const activeEnd =
                  rangeDraftStart && hoverIso
                    ? hoverIso
                    : !rangeDraftStart
                    ? parsed.endIso
                    : null;

                const normStart =
                  activeStart && activeEnd
                    ? activeStart <= activeEnd
                      ? activeStart
                      : activeEnd
                    : activeStart;
                const normEnd =
                  activeStart && activeEnd
                    ? activeStart <= activeEnd
                      ? activeEnd
                      : activeStart
                    : null;

                const isStartOrEnd =
                  cell.iso === normStart || (normEnd !== null && cell.iso === normEnd);
                const isBetween =
                  normStart !== null &&
                  normEnd !== null &&
                  cell.iso > normStart &&
                  cell.iso < normEnd;

                return (
                  <button
                    key={cell.iso}
                    type="button"
                    disabled={isDisabled}
                    onMouseEnter={() => {
                      if (isRangeMode && rangeDraftStart) setHoverIso(cell.iso);
                    }}
                    onClick={() => handleSelectIsoDay(cell.iso)}
                    className={`h-9 w-full rounded-lg text-sm tabular-nums flex items-center justify-center transition-colors ${
                      isDisabled
                        ? 'text-black/25 dark:text-white/25 cursor-not-allowed line-through'
                        : isStartOrEnd
                        ? `${accentClasses.selected} cursor-pointer`
                        : isBetween
                        ? `${accentClasses.inRange} font-semibold cursor-pointer`
                        : isToday
                        ? `${accentClasses.todayRing} hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer`
                        : cell.inCurrentMonth
                        ? 'text-black dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 font-medium cursor-pointer'
                        : 'text-black/40 dark:text-white/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer'
                    }`}
                  >
                    {cell.dayNum}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
              {clearable ? (
                <button
                  type="button"
                  onClick={() => {
                    onChange('');
                    setRangeDraftStart(null);
                    setIsOpen(false);
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-black/70 dark:text-white/75 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer inline-flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Clear' : 'Kosongkan'}</span>
                </button>
              ) : (
                <span className="text-xs font-medium text-black/60 dark:text-white/65 truncate">
                  {value ? value : isEn ? 'Pick a date' : 'Pilih tarikh'}
                </span>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-black dark:text-white cursor-pointer"
              >
                {isEn ? 'Done' : 'Tutup'}
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

// ============================================================================
// MODERN TIME PICKER COMPONENT
// ============================================================================

export interface QuickTimeSlotOption {
  label: string;
  value: string;
}

export interface ModernTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  mode?: 'single' | 'range';
  allowRangeToggle?: boolean;
  formatStyle?: '12h-pg' | '12h-am';
  quickSlots?: QuickTimeSlotOption[];
  defaultDurationMinutes?: number;
  placeholder?: string;
  disabled?: boolean;
  isEn?: boolean;
  accentColor?: 'blue' | 'teal' | 'indigo';
  className?: string;
}

interface Parsed12hTime {
  hour12: number; // 1..12
  minute: number; // 0..59
  meridiem: 'AM' | 'PM';
}

const parseSingle12hToken = (token: string): Parsed12hTime | null => {
  const m = token
    .trim()
    .toUpperCase()
    .match(/(\d{1,2})[:.](\d{2})\s*(PG|PTG|MLM|AM|PM)?/);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Math.min(59, Math.max(0, Number(m[2])));
  const suffix = m[3] || '';

  let meridiem: 'AM' | 'PM' = 'AM';
  if (suffix === 'PM' || suffix === 'PTG' || suffix === 'MLM') {
    meridiem = 'PM';
  } else if (suffix === 'AM' || suffix === 'PG') {
    meridiem = 'AM';
  } else if (h >= 12) {
    meridiem = 'PM';
  }

  if (h === 0) h = 12;
  if (h > 12) h = h - 12;

  return { hour12: Math.min(12, Math.max(1, h)), minute: min, meridiem };
};

const toTotalMinutes = (t: Parsed12hTime): number => {
  let h24 = t.hour12 % 12;
  if (t.meridiem === 'PM') h24 += 12;
  return h24 * 60 + t.minute;
};

const fromTotalMinutes = (totalMins: number): Parsed12hTime => {
  const wrapped = ((totalMins % (24 * 60)) + 24 * 60) % (24 * 60);
  const h24 = Math.floor(wrapped / 60);
  const minute = wrapped % 60;
  const meridiem: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM';
  const hour12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return { hour12, minute, meridiem };
};

const formatSingleTime = (t: Parsed12hTime, style: '12h-pg' | '12h-am'): string => {
  const hh = String(t.hour12).padStart(2, '0');
  const mm = String(t.minute).padStart(2, '0');
  if (style === '12h-am') {
    return `${hh}:${mm} ${t.meridiem}`;
  }
  const h24 = (t.hour12 % 12) + (t.meridiem === 'PM' ? 12 : 0);
  const suffix = t.meridiem === 'AM' ? 'PG' : h24 >= 19 ? 'MLM' : 'PTG';
  return `${hh}:${mm} ${suffix}`;
};

const parseTimeValue = (
  raw: string,
  defaultDurationMinutes: number
): { start: Parsed12hTime; end: Parsed12hTime; isRange: boolean } => {
  const fallbackStart: Parsed12hTime = { hour12: 10, minute: 0, meridiem: 'AM' };
  const fallbackEnd = fromTotalMinutes(toTotalMinutes(fallbackStart) + defaultDurationMinutes);

  if (!raw || !raw.trim()) {
    return { start: fallbackStart, end: fallbackEnd, isRange: false };
  }

  const parts = raw.split(/\s*[-–]\s*/);
  if (parts.length >= 2) {
    const s = parseSingle12hToken(parts[0]) || fallbackStart;
    const e = parseSingle12hToken(parts[1]) || fromTotalMinutes(toTotalMinutes(s) + defaultDurationMinutes);
    return { start: s, end: e, isRange: true };
  }

  const s = parseSingle12hToken(raw) || fallbackStart;
  return {
    start: s,
    end: fromTotalMinutes(toTotalMinutes(s) + defaultDurationMinutes),
    isRange: false
  };
};

export const ModernTimePicker: React.FC<ModernTimePickerProps> = ({
  value,
  onChange,
  mode = 'single',
  allowRangeToggle = false,
  formatStyle = '12h-pg',
  quickSlots,
  defaultDurationMinutes = 60,
  placeholder,
  disabled = false,
  isEn = false,
  accentColor = 'blue',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const parsed = useMemo(
    () => parseTimeValue(value, defaultDurationMinutes),
    [value, defaultDurationMinutes]
  );

  const [isRange, setIsRange] = useState<boolean>(mode === 'range' || parsed.isRange);
  const [activeTarget, setActiveTarget] = useState<'start' | 'end'>('start');
  const [startTime, setStartTime] = useState<Parsed12hTime>(parsed.start);
  const [endTime, setEndTime] = useState<Parsed12hTime>(parsed.end);

  useEffect(() => {
    if (isOpen) {
      setStartTime(parsed.start);
      setEndTime(parsed.end);
      setIsRange(mode === 'range' || parsed.isRange);
      setActiveTarget('start');
    }
  }, [isOpen, parsed.start, parsed.end, parsed.isRange, mode]);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }
      setIsOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  const coords = usePortalPopoverPosition(isOpen, triggerRef, panelRef, 344, 410);

  const accentClasses =
    accentColor === 'teal'
      ? {
          ring: 'focus:ring-teal-500/30 focus:border-teal-600 dark:focus:border-teal-500',
          selected: 'bg-teal-600 text-white border-teal-600 font-bold'
        }
      : accentColor === 'indigo'
      ? {
          ring: 'focus:ring-indigo-500/30 focus:border-indigo-600 dark:focus:border-indigo-500',
          selected: 'bg-indigo-600 text-white border-indigo-600 font-bold'
        }
      : {
          ring: 'focus:ring-blue-500/30 focus:border-blue-600 dark:focus:border-blue-500',
          selected: 'bg-blue-600 text-white border-blue-600 font-bold'
        };

  const commitTime = (nextStart: Parsed12hTime, nextEnd: Parsed12hTime, rangeFlag: boolean) => {
    if (rangeFlag) {
      onChange(`${formatSingleTime(nextStart, formatStyle)} - ${formatSingleTime(nextEnd, formatStyle)}`);
    } else {
      onChange(formatSingleTime(nextStart, formatStyle));
    }
  };

  const currentEditing = activeTarget === 'start' ? startTime : endTime;

  const updateCurrentEditing = (patch: Partial<Parsed12hTime>) => {
    if (activeTarget === 'start') {
      const updated = { ...startTime, ...patch };
      setStartTime(updated);
      let nextEnd = endTime;
      if (isRange && toTotalMinutes(endTime) <= toTotalMinutes(updated)) {
        nextEnd = fromTotalMinutes(toTotalMinutes(updated) + defaultDurationMinutes);
        setEndTime(nextEnd);
      }
      commitTime(updated, nextEnd, isRange);
    } else {
      const updatedEnd = { ...endTime, ...patch };
      setEndTime(updatedEnd);
      commitTime(startTime, updatedEnd, true);
    }
  };

  const defaultQuickSlots: QuickTimeSlotOption[] = useMemo(() => {
    if (quickSlots && quickSlots.length > 0) return quickSlots;
    if (isRange) {
      if (formatStyle === '12h-am') {
        return [
          { label: '09:00 AM - 10:00 AM', value: '09:00 AM - 10:00 AM' },
          { label: '10:00 AM - 11:00 AM', value: '10:00 AM - 11:00 AM' },
          { label: '11:30 AM - 12:30 PM', value: '11:30 AM - 12:30 PM' },
          { label: '02:30 PM - 03:30 PM', value: '02:30 PM - 03:30 PM' },
          { label: '04:00 PM - 05:00 PM', value: '04:00 PM - 05:00 PM' }
        ];
      }
      return [
        { label: '09:00 PG - 01:00 PTG', value: '09:00 PG - 01:00 PTG' },
        { label: '09:00 PG - 05:00 PTG', value: '09:00 PG - 05:00 PTG' },
        { label: '10:00 PG - 11:00 PG', value: '10:00 PG - 11:00 PG' },
        { label: '02:30 PTG - 04:30 PTG', value: '02:30 PTG - 04:30 PTG' },
        { label: '08:00 MLM - 10:30 MLM', value: '08:00 MLM - 10:30 MLM' }
      ];
    }
    if (formatStyle === '12h-am') {
      return [
        { label: '09:00 AM', value: '09:00 AM' },
        { label: '10:00 AM', value: '10:00 AM' },
        { label: '11:30 AM', value: '11:30 AM' },
        { label: '02:30 PM', value: '02:30 PM' },
        { label: '04:00 PM', value: '04:00 PM' }
      ];
    }
    return [
      { label: '09:00 PG', value: '09:00 PG' },
      { label: '10:00 PG', value: '10:00 PG' },
      { label: '11:30 PG', value: '11:30 PG' },
      { label: '02:30 PTG', value: '02:30 PTG' },
      { label: '04:00 PTG', value: '04:00 PTG' }
    ];
  }, [quickSlots, isRange, formatStyle]);

  const hoursList = [8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7];
  const minutesList = [0, 15, 30, 45];

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border ${
          isOpen
            ? 'border-blue-600 ring-2 ring-blue-500/25 bg-white dark:bg-slate-900'
            : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
        } text-left transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none ${accentClasses.ring} ${className}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Clock className="w-4 h-4 text-black/65 dark:text-white/70 shrink-0" />
          <span
            className={`truncate tabular-nums ${
              value
                ? 'font-semibold text-black dark:text-white'
                : 'font-normal text-black/50 dark:text-white/50'
            }`}
          >
            {value || placeholder || (isEn ? 'Select time' : 'Pilih masa')}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-black/55 dark:text-white/60 shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen &&
        coords &&
        createPortal(
          <div
            ref={panelRef}
            style={{ top: coords.top, left: coords.left, width: coords.width }}
            className="fixed z-[9999] bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-600 shadow-2xl p-3.5 space-y-3 animate-in fade-in zoom-in-95 duration-150"
            role="dialog"
            aria-label={isEn ? 'Time picker' : 'Pemilih Masa'}
          >
            {/* Optional Toggle between Single Time & Time Range */}
            {allowRangeToggle && (
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setIsRange(false);
                    setActiveTarget('start');
                    commitTime(startTime, endTime, false);
                  }}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    !isRange
                      ? 'bg-white dark:bg-slate-900 text-black dark:text-white shadow-2xs'
                      : 'text-black/65 dark:text-white/65 hover:text-black dark:hover:text-white'
                  }`}
                >
                  {isEn ? 'Single Time' : 'Waktu Tunggal'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRange(true);
                    commitTime(startTime, endTime, true);
                  }}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    isRange
                      ? 'bg-white dark:bg-slate-900 text-black dark:text-white shadow-2xs'
                      : 'text-black/65 dark:text-white/65 hover:text-black dark:hover:text-white'
                  }`}
                >
                  {isEn ? 'Time Range' : 'Julat Masa'}
                </button>
              </div>
            )}

            {/* Quick Time Slot Pills */}
            <div className="space-y-1.5">
              <div className="text-[0.75rem] font-bold text-black/60 dark:text-white/65 px-0.5">
                {isEn ? 'Quick Time Slots' : 'Pil Slot Masa Pantas'}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {defaultQuickSlots.map((slot) => {
                  const isActive = value.trim() === slot.value.trim();
                  return (
                    <button
                      key={slot.value}
                      type="button"
                      onClick={() => {
                        onChange(slot.value);
                        setIsOpen(false);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold tabular-nums border transition-colors cursor-pointer ${
                        isActive
                          ? accentClasses.selected
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-black dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {slot.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Range Start / End Switcher */}
            {isRange && (
              <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setActiveTarget('start')}
                  className={`p-2 rounded-xl border text-left transition-colors cursor-pointer ${
                    activeTarget === 'start'
                      ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-400 dark:border-blue-600'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="text-[0.6875rem] font-bold text-black/60 dark:text-white/65 uppercase">
                    {isEn ? 'Start' : 'Masa Mula'}
                  </div>
                  <div className="text-xs font-extrabold tabular-nums text-black dark:text-white mt-0.5">
                    {formatSingleTime(startTime, formatStyle)}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTarget('end')}
                  className={`p-2 rounded-xl border text-left transition-colors cursor-pointer ${
                    activeTarget === 'end'
                      ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-400 dark:border-blue-600'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="text-[0.6875rem] font-bold text-black/60 dark:text-white/65 uppercase">
                    {isEn ? 'End' : 'Masa Tamat'}
                  </div>
                  <div className="text-xs font-extrabold tabular-nums text-black dark:text-white mt-0.5">
                    {formatSingleTime(endTime, formatStyle)}
                  </div>
                </button>
              </div>
            )}

            {/* Interactive Hour, Minute & Meridiem Selector */}
            <div className="space-y-2.5 pt-1 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-black/65 dark:text-white/70">
                  {isRange
                    ? activeTarget === 'start'
                      ? isEn
                        ? 'Adjust Start Time'
                        : 'Laras Masa Mula'
                      : isEn
                      ? 'Adjust End Time'
                      : 'Laras Masa Tamat'
                    : isEn
                    ? 'Hour & Minute'
                    : 'Pilih Jam & Minit'}
                </span>

                {/* AM/PM or PG/PTG toggle */}
                <div className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  {(['AM', 'PM'] as const).map((mer) => (
                    <button
                      key={mer}
                      type="button"
                      onClick={() => updateCurrentEditing({ meridiem: mer })}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold cursor-pointer transition-colors ${
                        currentEditing.meridiem === mer
                          ? accentClasses.selected
                          : 'text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      {formatStyle === '12h-pg' ? (mer === 'AM' ? 'PG' : 'PTG/MLM') : mer}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hours 6x2 Grid */}
              <div>
                <div className="text-[0.6875rem] font-semibold text-black/55 dark:text-white/60 mb-1">
                  {isEn ? 'Hour' : 'Jam'}
                </div>
                <div className="grid grid-cols-6 gap-1">
                  {hoursList.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => updateCurrentEditing({ hour12: h })}
                      className={`h-8 rounded-lg text-xs font-bold tabular-nums border transition-colors cursor-pointer ${
                        currentEditing.hour12 === h
                          ? accentClasses.selected
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-black dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {String(h).padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minutes 4-chip + 5-min fine stepper */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[0.6875rem] font-semibold text-black/55 dark:text-white/60">
                    {isEn ? 'Minute' : 'Minit'}
                  </span>
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        updateCurrentEditing({
                          minute: (currentEditing.minute + 55) % 60
                        })
                      }
                      className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-black dark:text-white cursor-pointer"
                    >
                      -5m
                    </button>
                    <span className="text-xs font-bold tabular-nums px-1 text-black dark:text-white">
                      :{String(currentEditing.minute).padStart(2, '0')}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateCurrentEditing({
                          minute: (currentEditing.minute + 5) % 60
                        })
                      }
                      className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-black dark:text-white cursor-pointer"
                    >
                      +5m
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {minutesList.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => updateCurrentEditing({ minute: m })}
                      className={`h-8 rounded-lg text-xs font-bold tabular-nums border transition-colors cursor-pointer ${
                        currentEditing.minute === m
                          ? accentClasses.selected
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-black dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      :{String(m).padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
              <span className="text-xs font-bold tabular-nums text-black dark:text-white truncate">
                {value ||
                  (isRange
                    ? `${formatSingleTime(startTime, formatStyle)} - ${formatSingleTime(endTime, formatStyle)}`
                    : formatSingleTime(startTime, formatStyle))}
              </span>
              <button
                type="button"
                onClick={() => {
                  commitTime(startTime, endTime, isRange);
                  setIsOpen(false);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shrink-0"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isEn ? 'Done' : 'Selesai'}</span>
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
