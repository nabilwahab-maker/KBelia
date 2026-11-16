import React, { useMemo, useState } from 'react';
import {
  Users,
  Store,
  GraduationCap,
  MessageSquare,
  PieChart as PieChartIcon,
  BarChart3,
  FileText
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList
} from 'recharts';
import {
  BusinessListing,
  CapsuleBooking,
  GrantApplication,
  MentorProfile,
  MentorshipRegistration,
  MaintenanceTicket,
  YouthProgram,
  PortalNews,
  CommunityPost,
  PortalSettings
} from '../types';
import { PaginationBar, usePagination } from './PaginationBar';
import { ReferenceTableToolbar, RowActionMenu } from './ReferenceTableKit';
import {
  DEFAULT_SORT_VALUE,
  buildStandardSortOptions,
  compareText,
  getModifiedTimestamp,
  sortRecords
} from '../utils/sortUtils';

export type ReportUserTypeKey = 'all' | 'usahawan' | 'mentor' | 'komuniti';

interface UserTypeReportRecord {
  id: string;
  displayName: string;
  secondaryEntity: string;
  userType: Exclude<ReportUserTypeKey, 'all'>;
  userTypeLabel: string;
  locationOrAgency: string;
  activitySummary: string;
  metricDisplay: string;
  statusLabel: string;
  statusTone: 'emerald' | 'blue' | 'amber' | 'indigo';
  detailLine: string;
  modifiedMs: number;
}

interface UserTypeReportSectionProps {
  businesses: BusinessListing[];
  bookings: CapsuleBooking[];
  grantApplications: GrantApplication[];
  mentors: MentorProfile[];
  mentorshipRegistrations: MentorshipRegistration[];
  maintenanceTickets?: MaintenanceTicket[];
  programs?: YouthProgram[];
  newsItems?: PortalNews[];
  communityPosts: CommunityPost[];
  portalSettings?: PortalSettings;
}

const USER_TYPE_COLORS: Record<Exclude<ReportUserTypeKey, 'all'>, { fill: string; label: string; badgeBg: string }> = {
  usahawan: {
    fill: '#2563EB',
    label: 'Usahawan Belia',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800/70'
  },
  mentor: {
    fill: '#0D9488',
    label: 'Panel Mentor',
    badgeBg: 'bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800/70'
  },
  komuniti: {
    fill: '#D97706',
    label: 'Komuniti & Awam',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/70'
  }
};

export const UserTypeReportSection: React.FC<UserTypeReportSectionProps> = ({
  businesses = [],
  bookings = [],
  grantApplications = [],
  mentors = [],
  mentorshipRegistrations = [],
  communityPosts = []
}) => {
  const [selectedType, setSelectedType] = useState<ReportUserTypeKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>(DEFAULT_SORT_VALUE);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [chartMode, setChartMode] = useState<'bar' | 'donut'>('bar');

  const consolidatedRecords = useMemo<UserTypeReportRecord[]>(() => {
    const records: UserTypeReportRecord[] = [];
    const seenUsahawan = new Set<string>();

    // 1. Usahawan Belia (gabungan profil perniagaan, tempahan kiosk & permohonan geran)
    businesses.forEach((biz) => {
      const bizBookings = bookings.filter(
        (b) =>
          b.applicantId === biz.ownerId ||
          b.businessName?.toLowerCase() === biz.businessName?.toLowerCase()
      );
      const bizGrants = grantApplications.filter(
        (g) =>
          g.applicantId === biz.ownerId ||
          g.businessName?.toLowerCase() === biz.businessName?.toLowerCase()
      );
      const latestBooking = bizBookings[0];
      const latestGrant = bizGrants[0];
      const key = `${biz.ownerName}-${biz.businessName}`.toLowerCase();
      seenUsahawan.add(key);

      const activityParts: string[] = [];
      if (latestBooking) activityParts.push(`Kiosk ${latestBooking.slotCode}`);
      if (latestGrant) activityParts.push(`Geran ${latestGrant.programTitle}`);
      if (activityParts.length === 0) activityParts.push(biz.category || 'Profil Usahawan Sah');

      const grantTotal = bizGrants.reduce((sum, g) => {
        const parsed = parseFloat((g.amount || g.grantAmount || '0').replace(/[^0-9.]/g, ''));
        return sum + (isNaN(parsed) ? 0 : parsed);
      }, 0);

      const metricDisplay =
        grantTotal > 0
          ? `RM ${grantTotal.toLocaleString('ms-MY')}`
          : latestBooking?.monthlyRate
          ? `RM ${latestBooking.monthlyRate}/bln`
          : biz.ssmNumber || 'Berdaftar';

      const statusLabel = latestGrant?.status === 'approved' || latestBooking?.status === 'approved'
        ? 'Diluluskan'
        : latestGrant?.status === 'pending' || latestBooking?.status === 'pending'
        ? 'Dalam Semakan'
        : biz.isApproved
        ? 'Aktif'
        : 'Berdaftar';

      const statusTone: UserTypeReportRecord['statusTone'] =
        statusLabel === 'Diluluskan' || statusLabel === 'Aktif'
          ? 'emerald'
          : statusLabel === 'Dalam Semakan'
          ? 'amber'
          : 'blue';

      records.push({
        id: `usr-biz-${biz.id}`,
        displayName: biz.ownerName || 'Usahawan Belia',
        secondaryEntity: biz.businessName,
        userType: 'usahawan',
        userTypeLabel: 'Usahawan Belia',
        locationOrAgency: biz.district || 'Kelantan',
        activitySummary: activityParts.join(' · '),
        metricDisplay,
        statusLabel,
        statusTone,
        detailLine: `Kategori: ${biz.category} · No. SSM: ${biz.ssmNumber || 'Dalam Proses'} · Telefon: ${biz.ownerPhone || biz.whatsapp || '-'}`,
        modifiedMs: Math.max(
          getModifiedTimestamp(biz),
          latestBooking ? getModifiedTimestamp(latestBooking) : 0,
          latestGrant ? getModifiedTimestamp(latestGrant) : 0
        )
      });
    });

    // Pemohon kiosk atau geran yang belum mempunyai rekod direktori
    bookings.forEach((b) => {
      const key = `${b.applicantName}-${b.businessName}`.toLowerCase();
      if (seenUsahawan.has(key)) return;
      seenUsahawan.add(key);
      records.push({
        id: `usr-bk-${b.id}`,
        displayName: b.applicantName,
        secondaryEntity: b.businessName,
        userType: 'usahawan',
        userTypeLabel: 'Usahawan Belia',
        locationOrAgency: b.hubLocation || 'Hab KBelia',
        activitySummary: `Permohonan Kiosk ${b.slotCode} (${b.durationMonths} bln)`,
        metricDisplay: `RM ${(b.monthlyRate || 150).toLocaleString('ms-MY')}/bln`,
        statusLabel: b.status === 'approved' ? 'Diluluskan' : b.status === 'pending' ? 'Dalam Semakan' : 'Ditolak',
        statusTone: b.status === 'approved' ? 'emerald' : b.status === 'pending' ? 'amber' : 'indigo',
        detailLine: `Kategori: ${b.businessCategory} · Tarikh Mula: ${b.startDate || '-'} · Telefon: ${b.applicantPhone || '-'}`,
        modifiedMs: getModifiedTimestamp(b)
      });
    });

    grantApplications.forEach((g) => {
      const key = `${g.applicantName}-${g.businessName}`.toLowerCase();
      if (seenUsahawan.has(key)) return;
      seenUsahawan.add(key);
      records.push({
        id: `usr-gr-${g.id}`,
        displayName: g.applicantName,
        secondaryEntity: g.businessName,
        userType: 'usahawan',
        userTypeLabel: 'Usahawan Belia',
        locationOrAgency: g.district || 'Kelantan',
        activitySummary: `Permohonan ${g.programTitle}`,
        metricDisplay: g.amount || g.grantAmount || 'RM 3,000',
        statusLabel: g.status === 'approved' ? 'Diluluskan' : g.status === 'pending' ? 'Dalam Semakan' : 'Ditolak',
        statusTone: g.status === 'approved' ? 'emerald' : g.status === 'pending' ? 'amber' : 'indigo',
        detailLine: `Kategori: ${g.businessCategory} · Bank: ${g.bankName || '-'}`,
        modifiedMs: getModifiedTimestamp(g)
      });
    });

    // 2. Panel Mentor
    mentors.forEach((m) => {
      const assignedSessions = mentorshipRegistrations.filter(
        (r) =>
          r.mentorId === m.id ||
          r.mentorName?.toLowerCase() === m.name?.toLowerCase()
      );
      const completedSessions = assignedSessions.filter((r) => r.status === 'completed').length;

      records.push({
        id: `usr-mtr-${m.id}`,
        displayName: m.name,
        secondaryEntity: `${m.title} · ${m.agency}`,
        userType: 'mentor',
        userTypeLabel: 'Panel Mentor',
        locationOrAgency: m.agency || 'Universiti Malaysia Kelantan',
        activitySummary: m.expertise.slice(0, 2).join(', ') || 'Bimbingan Keusahawanan',
        metricDisplay: `${assignedSessions.length} Sesi (${completedSessions} Selesai)`,
        statusLabel: m.availableDays ? 'Mentor' : 'Jadual Penuh',
        statusTone: m.availableDays ? 'emerald' : 'amber',
        detailLine: `Jadual: ${m.availableDays || 'Waktu Pejabat'} · Hubungan: ${m.email || m.phone}`,
        modifiedMs: getModifiedTimestamp(m)
      });
    });

    // 3. Komuniti & Pelawat Awam
    communityPosts.forEach((post) => {
      records.push({
        id: `usr-com-${post.id}`,
        displayName: post.authorName || 'Ahli Komuniti',
        secondaryEntity: post.title,
        userType: 'komuniti',
        userTypeLabel: 'Komuniti & Awam',
        locationOrAgency: `${post.district} · ${post.category}`,
        activitySummary: `Topik Komuniti (${post.category})`,
        metricDisplay: `${post.replyCount || 0} Balasan · ${post.helpfulCount || 0} Sokong`,
        statusLabel: post.status === 'resolved' ? 'Terjawab' : 'Aktif',
        statusTone: post.status === 'resolved' ? 'emerald' : 'blue',
        detailLine: post.content.slice(0, 160) + (post.content.length > 160 ? '...' : ''),
        modifiedMs: getModifiedTimestamp(post)
      });
    });

    return records;
  }, [
    businesses,
    bookings,
    grantApplications,
    mentors,
    mentorshipRegistrations,
    communityPosts
  ]);

  const countsByType = useMemo(() => {
    const counts = {
      usahawan: 0,
      mentor: 0,
      komuniti: 0
    };
    consolidatedRecords.forEach((r) => {
      counts[r.userType] += 1;
    });
    return counts;
  }, [consolidatedRecords]);

  const totalCount = Math.max(1, consolidatedRecords.length);

  const donutChartData = useMemo(
    () =>
      (Object.keys(USER_TYPE_COLORS) as Array<Exclude<ReportUserTypeKey, 'all'>>).map((key) => ({
        key,
        name: USER_TYPE_COLORS[key].label,
        shortLabel:
          key === 'usahawan'
            ? 'Usahawan'
            : key === 'mentor'
            ? 'Mentor'
            : 'Komuniti',
        count: countsByType[key],
        percentage: Math.round((countsByType[key] / totalCount) * 100),
        color: USER_TYPE_COLORS[key].fill
      })),
    [countsByType, totalCount]
  );

  const reportSortOptions = useMemo(
    () =>
      buildStandardSortOptions([
        { value: 'type_asc', label: 'Jenis Pengguna (A - Z)' },
        { value: 'location_asc', label: 'Daerah / Agensi (A - Z)' }
      ]),
    []
  );

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = consolidatedRecords.filter((rec) => {
      const matchType = selectedType === 'all' || rec.userType === selectedType;
      const matchQuery =
        !q ||
        rec.displayName.toLowerCase().includes(q) ||
        rec.secondaryEntity.toLowerCase().includes(q) ||
        rec.locationOrAgency.toLowerCase().includes(q) ||
        rec.activitySummary.toLowerCase().includes(q) ||
        rec.userTypeLabel.toLowerCase().includes(q);
      return matchType && matchQuery;
    });

    return sortRecords(filtered, {
      sortBy,
      getName: (rec) => rec.displayName || '',
      getModified: (rec) => rec.modifiedMs,
      customCompare: (a, b, mode) => {
        if (mode === 'type_asc') return compareText(a.userTypeLabel, b.userTypeLabel);
        if (mode === 'location_asc') return compareText(a.locationOrAgency, b.locationOrAgency);
        return null;
      }
    });
  }, [consolidatedRecords, selectedType, searchQuery, sortBy]);

  const pagination = usePagination(filteredRecords, 6, [
    selectedType,
    searchQuery,
    sortBy,
    filteredRecords.length
  ]);

  const activeDonutFocus =
    selectedType === 'all'
      ? { label: 'Semua Pengguna', count: consolidatedRecords.length, percentage: 100 }
      : {
          label: USER_TYPE_COLORS[selectedType].label,
          count: countsByType[selectedType],
          percentage: Math.round((countsByType[selectedType] / totalCount) * 100)
        };

  return (
    <section className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-300 dark:border-zinc-700">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-black dark:text-white" />
          <h3 className="text-base sm:text-lg font-bold text-black dark:text-white">
            Laporan Data Terkumpul Mengikut Jenis Pengguna
          </h3>
        </div>
        <p className="text-sm sm:text-[0.9375rem] text-black/75 dark:text-white/80 mt-0.5">
          Susunan bersepadu rekod Usahawan Belia, Panel Mentor, dan Komuniti Awam
        </p>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {/* Balanced Vertical Stack: Full-Width Chart on Top + 3 Equal-Width/Height Cards Below */}
        <div className="space-y-5">
          {/* Top Tier: Full-Width Bar/Donut Chart + Compact 3-Column Bottom Legend */}
          <div className="w-full min-w-0 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-300 dark:border-zinc-700">
              <div className="flex items-center gap-2">
                {chartMode === 'bar' ? (
                  <BarChart3 className="w-4 h-4 text-black dark:text-white" />
                ) : (
                  <PieChartIcon className="w-4 h-4 text-black dark:text-white" />
                )}
                <h4 className="text-[0.9375rem] font-bold text-black dark:text-white">
                  Komposisi Jenis Pengguna
                </h4>
              </div>
              <div className="inline-flex items-center gap-1 p-0.5 bg-white dark:bg-zinc-900 rounded-lg border border-slate-300 dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => setChartMode('bar')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    chartMode === 'bar'
                      ? 'bg-blue-600 text-white'
                      : 'text-black/75 dark:text-white/80 hover:text-black dark:hover:text-white'
                  }`}
                >
                  Graf Bar
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode('donut')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    chartMode === 'donut'
                      ? 'bg-blue-600 text-white'
                      : 'text-black/75 dark:text-white/80 hover:text-black dark:hover:text-white'
                  }`}
                >
                  Donut
                </button>
              </div>
            </div>

            <div className="relative h-64 min-h-[256px] w-full min-w-0 my-2 [&_.recharts-cartesian-axis-tick_text]:fill-slate-700 dark:[&_.recharts-cartesian-axis-tick_text]:fill-slate-200">
              <ResponsiveContainer width="100%" height={256} minWidth={0} initialDimension={{ width: 640, height: 256 }}>
                {chartMode === 'bar' ? (
                  <BarChart
                    data={donutChartData}
                    barCategoryGap="24%"
                    margin={{ top: 26, right: 20, left: -4, bottom: 6 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.24)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12.5, fontWeight: 600 }} interval={0} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, (dataMax: number) => Math.max(dataMax, 4)]} allowDecimals={false} tick={{ fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(37, 99, 235, 0.10)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload as typeof donutChartData[number];
                          return (
                            <div className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-sm shadow-xl border border-slate-700">
                              <div className="font-bold text-white">{d.name}</div>
                              <div className="font-mono tabular-nums text-white/90">
                                {d.count} Rekod ({d.percentage}%)
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="#2563EB"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={72}
                      minPointSize={(val) => (Number(val) > 0 ? 6 : 0)}
                      isAnimationActive={false}
                      onClick={(data) => {
                        const clickedKey = (data as unknown as { key?: Exclude<ReportUserTypeKey, 'all'> })?.key;
                        if (clickedKey) {
                          setSelectedType(selectedType === clickedKey ? 'all' : clickedKey);
                        }
                      }}
                      className="cursor-pointer"
                    >
                      {donutChartData.map((entry) => (
                        <Cell
                          key={entry.key}
                          fill={entry.color}
                          opacity={selectedType === 'all' || selectedType === entry.key ? 1 : 0.4}
                        />
                      ))}
                      <LabelList
                        dataKey="count"
                        position="top"
                        formatter={(val: unknown) => String(Number(val) || 0)}
                        className="fill-slate-900 dark:fill-slate-100 font-mono"
                        style={{ fontSize: 12.5, fontWeight: 700 }}
                      />
                    </Bar>
                  </BarChart>
                ) : (
                  <PieChart>
                    <Pie
                      data={donutChartData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      strokeWidth={2}
                      stroke="#FFFFFF"
                      isAnimationActive={false}
                      onClick={(_, idx) => {
                        const clicked = donutChartData[idx];
                        if (clicked) {
                          setSelectedType(selectedType === clicked.key ? 'all' : clicked.key);
                        }
                      }}
                      className="cursor-pointer outline-none"
                    >
                      {donutChartData.map((entry) => (
                        <Cell
                          key={entry.key}
                          fill={entry.color}
                          opacity={selectedType === 'all' || selectedType === entry.key ? 1 : 0.45}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload as typeof donutChartData[number];
                          return (
                            <div className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-sm shadow-xl border border-slate-700">
                              <div className="font-bold text-white">{d.name}</div>
                              <div className="font-mono tabular-nums text-white/90">
                                {d.count} Rekod ({d.percentage}%)
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                )}
              </ResponsiveContainer>

              {chartMode === 'donut' && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                  <span className="text-[0.8125rem] font-semibold text-black/75 dark:text-white/80 truncate max-w-[125px]">
                    {activeDonutFocus.label}
                  </span>
                  <span className="text-2xl font-extrabold font-mono text-black dark:text-white tabular-nums leading-tight">
                    {activeDonutFocus.percentage}%
                  </span>
                  <span className="text-[0.8125rem] font-medium text-black/75 dark:text-white/80 tabular-nums">
                    {activeDonutFocus.count} Rekod
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-slate-300 dark:border-zinc-700">
              {donutChartData.map((entry) => (
                <button
                  key={entry.key}
                  type="button"
                  onClick={() => setSelectedType(selectedType === entry.key ? 'all' : entry.key)}
                  className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-[0.8125rem] font-medium cursor-pointer transition-colors ${
                    selectedType === entry.key
                      ? 'bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-600 font-bold text-black dark:text-white shadow-2xs'
                      : 'text-black/80 dark:text-white/80 hover:bg-white/70 dark:hover:bg-zinc-900/70 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="truncate">{entry.name}</span>
                  </span>
                  <span className="font-mono font-bold tabular-nums shrink-0">{entry.percentage}%</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Tier: 3 Equal-Width, Equal-Height Summary Cards in a Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
            <button
              type="button"
              onClick={() => setSelectedType(selectedType === 'usahawan' ? 'all' : 'usahawan')}
              className={`h-full p-4 sm:p-5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                selectedType === 'usahawan'
                  ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-600 ring-1 ring-blue-500/40'
                  : 'bg-slate-50 dark:bg-zinc-950 border-slate-300 dark:border-zinc-700 hover:bg-blue-50/40 dark:hover:bg-zinc-800/70'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[0.9375rem] font-bold text-black dark:text-white">Usahawan Belia</span>
                <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Store className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-2xl sm:text-[1.75rem] font-extrabold font-mono text-black dark:text-white tabular-nums leading-none">
                  {countsByType.usahawan}
                </span>
                <span className="text-sm font-mono font-bold text-black/80 dark:text-white/85 tabular-nums">
                  {Math.round((countsByType.usahawan / totalCount) * 100)}%
                </span>
              </div>
              <p className="text-[0.8125rem] sm:text-sm text-black/75 dark:text-white/80 leading-snug">
                {businesses.length} perniagaan · {bookings.length} tempahan · {grantApplications.length} geran
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedType(selectedType === 'mentor' ? 'all' : 'mentor')}
              className={`h-full p-4 sm:p-5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                selectedType === 'mentor'
                  ? 'bg-teal-50/90 dark:bg-teal-950/40 border-teal-600 ring-1 ring-teal-500/40'
                  : 'bg-slate-50 dark:bg-zinc-950 border-slate-300 dark:border-zinc-700 hover:bg-teal-50/40 dark:hover:bg-zinc-800/70'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[0.9375rem] font-bold text-black dark:text-white">Panel Mentor</span>
                <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
                  <GraduationCap className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-2xl sm:text-[1.75rem] font-extrabold font-mono text-black dark:text-white tabular-nums leading-none">
                  {countsByType.mentor}
                </span>
                <span className="text-sm font-mono font-bold text-black/80 dark:text-white/85 tabular-nums">
                  {Math.round((countsByType.mentor / totalCount) * 100)}%
                </span>
              </div>
              <p className="text-[0.8125rem] sm:text-sm text-black/75 dark:text-white/80 leading-snug">
                {mentors.length} mentor · {mentorshipRegistrations.length} sesi bimbingan
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedType(selectedType === 'komuniti' ? 'all' : 'komuniti')}
              className={`h-full p-4 sm:p-5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                selectedType === 'komuniti'
                  ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-600 ring-1 ring-amber-500/40'
                  : 'bg-slate-50 dark:bg-zinc-950 border-slate-300 dark:border-zinc-700 hover:bg-amber-50/40 dark:hover:bg-zinc-800/70'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[0.9375rem] font-bold text-black dark:text-white">Komuniti &amp; Awam</span>
                <div className="w-9 h-9 rounded-lg bg-amber-500 text-black flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-2xl sm:text-[1.75rem] font-extrabold font-mono text-black dark:text-white tabular-nums leading-none">
                  {countsByType.komuniti}
                </span>
                <span className="text-sm font-mono font-bold text-black/80 dark:text-white/85 tabular-nums">
                  {Math.round((countsByType.komuniti / totalCount) * 100)}%
                </span>
              </div>
              <p className="text-[0.8125rem] sm:text-sm text-black/75 dark:text-white/80 leading-snug">
                {communityPosts.length} topik perbincangan forum komuniti
              </p>
            </button>
          </div>
        </div>

        {/* Reference-Style Unified User-Type Data Table Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-2xs overflow-visible">
          <ReferenceTableToolbar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Cari nama, perniagaan atau daerah..."
            filterCount={(selectedType !== 'all' ? 1 : 0) + (sortBy !== DEFAULT_SORT_VALUE ? 1 : 0)}
            onResetFilters={() => {
              setSelectedType('all');
              setSortBy(DEFAULT_SORT_VALUE);
            }}
            sortOptions={reportSortOptions}
            sortValue={sortBy}
            onSortChange={setSortBy}
            filterContent={
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black/65 dark:text-white/70 mb-1.5">
                  Jenis Pengguna
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {(
                    [
                      { id: 'all', label: `Semua (${consolidatedRecords.length})` },
                      { id: 'usahawan', label: `Usahawan (${countsByType.usahawan})` },
                      { id: 'mentor', label: `Mentor (${countsByType.mentor})` },
                      { id: 'komuniti', label: `Komuniti (${countsByType.komuniti})` }
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedType(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border text-left transition-colors cursor-pointer ${
                        selectedType === tab.id
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 dark:bg-zinc-950 text-black dark:text-white border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            }
          />

          {filteredRecords.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <Users className="w-8 h-8 text-black/35 dark:text-white/35 mx-auto" />
              <p className="text-sm font-bold text-black dark:text-white">Tiada Rekod Pengguna Dijumpai</p>
              <p className="text-sm text-black/70 dark:text-white/75">
                Cuba pilih penapis jenis pengguna lain atau tukar kata kunci carian anda.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 dark:bg-zinc-950/90 border-b border-slate-200 dark:border-zinc-700 text-[0.8125rem] font-semibold text-black/65 dark:text-white/70">
                      <th className="py-3 pl-4 pr-2 w-12 text-center">Bil</th>
                      <th className="py-3 px-3">Nama &amp; Entiti</th>
                      <th className="py-3 px-3">Jenis Pengguna</th>
                      <th className="py-3 px-3">Daerah / Agensi</th>
                      <th className="py-3 px-3">Ringkasan Aktiviti</th>
                      <th className="py-3 px-3 text-right">Metrik</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 pl-2 pr-4 w-12 text-right">
                        <span className="sr-only">Tindakan</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-zinc-700 text-black dark:text-white">
                    {pagination.paginatedItems.map((rec, idx) => {
                      const rowNumber = (pagination.currentPage - 1) * 6 + idx + 1;
                      const isExpanded = expandedRowId === rec.id;
                      const badgeStyle = USER_TYPE_COLORS[rec.userType].badgeBg;
                      const statusBg =
                        rec.statusTone === 'emerald'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/70 text-emerald-700 dark:text-emerald-300'
                          : rec.statusTone === 'amber'
                          ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/70 text-amber-700 dark:text-amber-300'
                          : rec.statusTone === 'blue'
                          ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800/70 text-blue-700 dark:text-blue-300'
                          : 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800/70 text-indigo-700 dark:text-indigo-300';

                      return (
                        <React.Fragment key={rec.id}>
                          <tr className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                            <td className="py-3.5 pl-4 pr-2 text-center font-mono text-black/75 dark:text-white/75 tabular-nums">
                              {rowNumber}
                            </td>
                            <td className="py-3.5 px-3">
                              <div className="font-semibold text-black dark:text-white leading-snug">
                                {rec.displayName}
                              </div>
                              <div className="text-xs text-black/65 dark:text-white/70 truncate max-w-[220px]">
                                {rec.secondaryEntity}
                              </div>
                            </td>
                            <td className="py-3.5 px-3 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-semibold text-black dark:text-white ${badgeStyle}`}>
                                {rec.userTypeLabel}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-black/75 dark:text-white/80 whitespace-nowrap">
                              {rec.locationOrAgency}
                            </td>
                            <td className="py-3.5 px-3 text-black/80 dark:text-white/85 max-w-[240px]">
                              <span className="line-clamp-2">{rec.activitySummary}</span>
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono font-bold text-black dark:text-white tabular-nums whitespace-nowrap">
                              {rec.metricDisplay}
                            </td>
                            <td className="py-3.5 px-3 text-center whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-semibold ${statusBg}`}>
                                {rec.statusLabel}
                              </span>
                            </td>
                            <td className="py-3.5 pl-2 pr-4 text-right whitespace-nowrap">
                              <RowActionMenu
                                ariaLabel={`Tindakan untuk ${rec.displayName}`}
                                items={[
                                  {
                                    label: isExpanded ? 'Tutup Maklumat' : 'Lihat Maklumat Tambahan',
                                    onClick: () => setExpandedRowId(isExpanded ? null : rec.id)
                                  }
                                ]}
                              />
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-slate-50/80 dark:bg-zinc-950/70">
                              <td colSpan={8} className="px-6 py-3.5 text-sm text-black dark:text-white border-t border-slate-200 dark:border-zinc-700">
                                <span className="font-bold mr-2">Maklumat Tambahan:</span>
                                <span>{rec.detailLine}</span>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <PaginationBar
                currentPage={pagination.currentPage}
                totalItems={pagination.totalItems}
                itemsPerPage={6}
                onPageChange={pagination.setCurrentPage}
                itemLabel="rekod pengguna"
                accent="blue"
              />
            </>
          )}
        </div>
      </div>
    </section>
  );
};
