export interface ToolbarSortOption {
  value: string;
  label: string;
}

const textCollator = new Intl.Collator('ms-MY', {
  sensitivity: 'base',
  numeric: true
});

export const compareText = (a?: string | null, b?: string | null): number =>
  textCollator.compare((a || '').trim(), (b || '').trim());

export const parseNumericAmount = (value?: string | number | null): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const cleaned = String(value).replace(/[^0-9.-]/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getTimestampMs = (value: unknown): number => {
  if (!value) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (value instanceof Date) {
    const t = value.getTime();
    return Number.isFinite(t) ? t : 0;
  }
  if (typeof value === 'object' && value !== null) {
    const record = value as { toDate?: () => Date; seconds?: number; _seconds?: number };
    if (typeof record.toDate === 'function') {
      const t = record.toDate().getTime();
      return Number.isFinite(t) ? t : 0;
    }
    const sec = record.seconds ?? record._seconds;
    if (typeof sec === 'number' && Number.isFinite(sec)) {
      return sec * 1000;
    }
  }
  const str = String(value).trim();
  if (!str) return 0;
  const parsed = Date.parse(str);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getModifiedTimestamp = (item: unknown): number => {
  if (!item || typeof item !== 'object') return 0;
  const record = item as Record<string, unknown>;
  const candidates = [
    record.updatedAt,
    record.publishedAt,
    record.tenancySignedAt,
    record.lastActive,
    record.createdAt,
    record.date,
    record.timestamp
  ];
  for (const candidate of candidates) {
    const ms = getTimestampMs(candidate);
    if (ms > 0) return ms;
  }
  return 0;
};

export const DEFAULT_SORT_VALUE = 'modified_desc';

export const buildStandardSortOptions = (
  extraOptions: ToolbarSortOption[] = [],
  isEn = false,
  nameLabels?: { asc: string; desc: string }
): ToolbarSortOption[] => [
  {
    value: 'modified_desc',
    label: isEn ? 'Last Modified (Newest)' : 'Tarikh Diubah Suai (Terbaru)'
  },
  {
    value: 'modified_asc',
    label: isEn ? 'Last Modified (Oldest)' : 'Tarikh Diubah Suai (Terlama)'
  },
  {
    value: 'name_asc',
    label: nameLabels?.asc || (isEn ? 'Name (A - Z)' : 'Nama (A - Z)')
  },
  {
    value: 'name_desc',
    label: nameLabels?.desc || (isEn ? 'Name (Z - A)' : 'Nama (Z - A)')
  },
  ...extraOptions
];

export interface SortRecordsConfig<T> {
  sortBy: string;
  getName: (item: T) => string;
  getModified?: (item: T) => number;
  customCompare?: (a: T, b: T, sortBy: string) => number | null | undefined;
}

export const sortRecords = <T,>(
  items: T[],
  config: SortRecordsConfig<T>
): T[] => {
  const { sortBy, getName, getModified = getModifiedTimestamp, customCompare } = config;
  return [...items].sort((a, b) => {
    if (customCompare) {
      const custom = customCompare(a, b, sortBy);
      if (custom !== null && custom !== undefined && custom !== 0) {
        return custom;
      }
      if (custom === 0 && sortBy !== 'modified_desc' && sortBy !== 'modified_asc' && sortBy !== 'name_asc' && sortBy !== 'name_desc') {
        const modDiff = getModified(b) - getModified(a);
        return modDiff !== 0 ? modDiff : compareText(getName(a), getName(b));
      }
    }

    if (sortBy === 'modified_asc') {
      const diff = getModified(a) - getModified(b);
      return diff !== 0 ? diff : compareText(getName(a), getName(b));
    }
    if (sortBy === 'name_asc') {
      const diff = compareText(getName(a), getName(b));
      return diff !== 0 ? diff : getModified(b) - getModified(a);
    }
    if (sortBy === 'name_desc') {
      const diff = compareText(getName(b), getName(a));
      return diff !== 0 ? diff : getModified(b) - getModified(a);
    }

    // Default: modified_desc (Tarikh Diubah Suai - Terbaru dahulu)
    const diff = getModified(b) - getModified(a);
    return diff !== 0 ? diff : compareText(getName(a), getName(b));
  });
};
