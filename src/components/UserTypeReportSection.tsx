import React, { useMemo, useState } from 'react';
import {
  Users,
  Store,
  GraduationCap,
  MessageSquare,
  Search,
  PieChart as PieChartIcon,
  BarChart3,
  FileText,
  ChevronDown,
  ChevronUp
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
        detailLine: `Kategori: ${biz.category} · No. SSM: ${biz.ssmNumber || 'Dalam Proses'} · Telefon: ${biz.ownerPhone || biz.whatsapp || '-'}`
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
        detailLine: `Kategori: ${b.businessCategory} · Tarikh Mula: ${b.startDate || '-'} · Telefon: ${b.applicantPhone || '-'}`
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
        detailLine: `Kategori: ${g.businessCategory} · Bank: ${g.bankName || '-'}`
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
        statusLabel: m.availableDays ? 'Aktif Bertauliah' : 'Jadual Penuh',
        statusTone: m.availableDays ? 'emerald' : 'amber',
        detailLine: `Jadual: ${m.availableDays || 'Waktu Pejabat'} · Hubungan: ${m.email || m.phone}`
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
        detailLine: post.content.slice(0, 160) + (post.content.length > 160 ? '...' : '')
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

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return consolidatedRecords.filter((rec) => {
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
  }, [consolidatedRecords, selectedType, searchQuery]);

  const pagination = usePagination(filteredRecords, 6, [selectedType, searchQuery, filteredRecords.length]);

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
      <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-300 dark:border-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
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
        <span className="text-sm font-mono font-bold px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-600 text-black dark:text-white tabular-nums self-start sm:self-auto">
          {consolidatedRecords.length} Jumlah Rekod
        </span>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {/* Top Row: 3 User-Type Summary Cards + Clean Percentage Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left 7 Cols: 3 User Type Cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => setSelectedType(selectedType === 'usahawan' ? 'all' : 'usahawan')}
              className={`p-4 sm:p-5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
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
                <span className="text-2xl sm:text-[1.75rem] font-extrabold font-mono text-black dark:text-white tabular-nums">
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
              className={`p-4 sm:p-5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
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
                <span className="text-2xl sm:text-[1.75rem] font-extrabold font-mono text-black dark:text-white tabular-nums">
                  {countsByType.mentor}
                </span>
                <span className="text-sm font-mono font-bold text-black/80 dark:text-white/85 tabular-nums">
                  {Math.round((countsByType.mentor / totalCount) * 100)}%
                </span>
              </div>
              <p className="text-[0.8125rem] sm:text-sm text-black/75 dark:text-white/80 leading-snug">
                {mentors.length} mentor bertauliah · {mentorshipRegistrations.length} sesi bimbingan
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedType(selectedType === 'komuniti' ? 'all' : 'komuniti')}
              className={`p-4 sm:p-5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
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

          {/* Right 5 Cols: BarChart Default + Donut Toggle for User Types */}
          <div className="lg:col-span-5 min-w-0 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 p-4 sm:p-5 flex flex-col justify-between h-fit">
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
                  className={`px-2 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
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
                  className={`px-2 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                    chartMode === 'donut'
                      ? 'bg-blue-600 text-white'
                      : 'text-black/75 dark:text-white/80 hover:text-black dark:hover:text-white'
                  }`}
                >
                  Donut
                </button>
              </div>
            </div>

            <div className="relative h-60 min-h-[240px] w-full min-w-0 my-1 [&_.recharts-cartesian-axis-tick_text]:fill-slate-700 dark:[&_.recharts-cartesian-axis-tick_text]:fill-slate-200">
              <ResponsiveContainer width="100%" height={240} minWidth={0} initialDimension={{ width: 420, height: 240 }}>
                {chartMode === 'bar' ? (
                  <BarChart
                    data={donutChartData}
                    barCategoryGap="22%"
                    margin={{ top: 24, right: 12, left: -4, bottom: 6 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.24)" />
                    <XAxis dataKey="shortLabel" tick={{ fontSize: 12, fontWeight: 600 }} interval={0} axisLine={false} tickLine={false} />
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
                      maxBarSize={46}
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
                        style={{ fontSize: 12, fontWeight: 700 }}
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
                      innerRadius={56}
                      outerRadius={84}
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
                  <span className="text-[0.8125rem] font-semibold text-black/75 dark:text-white/80 truncate max-w-[115px]">
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

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-300 dark:border-zinc-700">
              {donutChartData.map((entry) => (
                <button
                  key={entry.key}
                  type="button"
                  onClick={() => setSelectedType(selectedType === entry.key ? 'all' : entry.key)}
                  className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-[0.8125rem] font-medium cursor-pointer transition-colors ${
                    selectedType === entry.key
                      ? 'bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-600 font-bold text-black dark:text-white'
                      : 'text-black/80 dark:text-white/80 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="truncate">{entry.name}</span>
                  </span>
                  <span className="font-mono font-bold tabular-nums shrink-0">{entry.percentage}%</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-zinc-700">
          <div className="flex flex-wrap items-center gap-1.5">
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
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  selectedType === tab.id
                    ? 'bg-blue-600 text-white dark:bg-blue-600'
                    : 'bg-slate-100 dark:bg-zinc-800 text-black dark:text-white border border-slate-300 dark:border-zinc-600 hover:bg-slate-200 dark:hover:bg-zinc-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-black/55 dark:text-white/55 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Masukkan kata kunci carian"
              className="w-full pl-9 pr-3.5 py-2 rounded-xl text-[0.9375rem] bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 text-black dark:text-white placeholder:text-black/45 dark:placeholder:text-white/45 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600"
            />
          </div>
        </div>

        {/* Neatly Organized Unified User-Type Data Table */}
        {filteredRecords.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950">
            <Users className="w-8 h-8 text-black/40 dark:text-white/40 mx-auto mb-2" />
            <p className="text-base font-bold text-black dark:text-white">Tiada Rekod Pengguna Dijumpai</p>
            <p className="text-[0.9375rem] text-black/70 dark:text-white/75 mt-1">
              Cuba pilih penapis jenis pengguna lain atau tukar kata kunci carian anda.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="overflow-x-auto rounded-xl border border-slate-300 dark:border-zinc-700">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-zinc-950 border-b border-slate-300 dark:border-zinc-700 text-[0.8125rem] font-bold uppercase tracking-wide text-black dark:text-white">
                    <th className="py-3 px-4 w-12 text-center">Bil</th>
                    <th className="py-3 px-4">Nama &amp; Entiti</th>
                    <th className="py-3 px-4">Jenis Pengguna</th>
                    <th className="py-3 px-4">Daerah / Agensi</th>
                    <th className="py-3 px-4">Ringkasan Aktiviti</th>
                    <th className="py-3 px-4 text-right">Metrik</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Butiran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-zinc-700 text-[0.9375rem]">
                  {pagination.paginatedItems.map((rec, idx) => {
                    const rowNumber = (pagination.currentPage - 1) * 6 + idx + 1;
                    const isExpanded = expandedRowId === rec.id;
                    const badgeStyle = USER_TYPE_COLORS[rec.userType].badgeBg;
                    const statusBg =
                      rec.statusTone === 'emerald'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700'
                        : rec.statusTone === 'amber'
                        ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700'
                        : rec.statusTone === 'blue'
                        ? 'bg-blue-100 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700'
                        : 'bg-indigo-100 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700';

                    return (
                      <React.Fragment key={rec.id}>
                        <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors">
                          <td className="py-3.5 px-4 text-center font-mono text-black/80 dark:text-white/80 tabular-nums">
                            {rowNumber}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-black dark:text-white leading-snug">
                              {rec.displayName}
                            </div>
                            <div className="text-[0.8125rem] sm:text-sm text-black/75 dark:text-white/80 truncate max-w-[240px]">
                              {rec.secondaryEntity}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[0.8125rem] font-semibold text-black dark:text-white ${badgeStyle}`}>
                              {rec.userTypeLabel}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-black/85 dark:text-white/85 whitespace-nowrap">
                            {rec.locationOrAgency}
                          </td>
                          <td className="py-3.5 px-4 text-black/85 dark:text-white/85 max-w-[260px]">
                            <span className="line-clamp-2">{rec.activitySummary}</span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-black dark:text-white tabular-nums whitespace-nowrap">
                            {rec.metricDisplay}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[0.8125rem] font-bold text-black dark:text-white ${statusBg}`}>
                              {rec.statusLabel}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setExpandedRowId(isExpanded ? null : rec.id)}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 border border-slate-300 dark:border-zinc-600 text-[0.8125rem] font-semibold text-black dark:text-white inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>{isExpanded ? 'Tutup' : 'Lihat'}</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-slate-50/80 dark:bg-zinc-950/70">
                            <td colSpan={8} className="px-6 py-3.5 text-[0.9375rem] text-black dark:text-white border-t border-slate-200 dark:border-zinc-700">
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
          </div>
        )}
      </div>
    </section>
  );
};
