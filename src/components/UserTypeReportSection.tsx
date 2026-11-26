import React, { useMemo, useState } from 'react';
import {
  Users,
  Store,
  GraduationCap,
  ShieldCheck,
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
import { useAnimatedMetric, usePrefersReducedMotion } from '../hooks/useMotion';
import { AnimatedShimmerBar, AnimatedShimmerBarProps } from './AnimatedShimmerBar';
import { getRoleTheme } from '../utils/roleTheme';

const adminTheme = getRoleTheme('admin');

export type ReportUserTypeKey = 'all' | 'belia' | 'mentor' | 'admin';

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
  statusTone: 'emerald' | 'blue' | 'amber' | 'bronze';
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

const USER_TYPE_COLORS: Record<Exclude<ReportUserTypeKey, 'all'>, { fill: string; label: string; textTone: string }> = {
  belia: {
    fill: '#10B981',
    label: 'Usahawan Belia',
    textTone: 'text-[#0B6E52] dark:text-[#34D399]'
  },
  mentor: {
    fill: '#2563EB',
    label: 'Panel Mentor',
    textTone: 'text-[#1D4ED8] dark:text-[#38BDF8]'
  },
  admin: {
    fill: '#D98A4E',
    label: 'Pentadbir KBelia',
    textTone: 'text-[#9A5628] dark:text-[#D98A4E]'
  }
};

export const UserTypeReportSection: React.FC<UserTypeReportSectionProps> = ({
  businesses = [],
  bookings = [],
  grantApplications = [],
  mentors = [],
  mentorshipRegistrations = [],
  maintenanceTickets = [],
  programs = [],
  newsItems = [],
  communityPosts = [],
  portalSettings
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();
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
          ? `RM ${latestBooking.monthlyRate}/bulan`
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
        userType: 'belia',
        userTypeLabel: 'Usahawan Belia',
        locationOrAgency: biz.district || 'Kelantan',
        activitySummary: activityParts.join(' · '),
        metricDisplay,
        statusLabel,
        statusTone,
        detailLine: `Kategori: ${biz.category === 'Makanan & Minuman (F&B)' ? 'Makanan & Minuman' : biz.category} · Nombor SSM: ${biz.ssmNumber || 'Dalam Proses'} · Telefon: ${biz.ownerPhone || biz.whatsapp || '-'}`,
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
        userType: 'belia',
        userTypeLabel: 'Usahawan Belia',
        locationOrAgency: b.hubLocation || 'Hab KBelia',
        activitySummary: `Permohonan Kiosk ${b.slotCode} (${b.durationMonths} bulan)`,
        metricDisplay: `RM ${(b.monthlyRate || 150).toLocaleString('ms-MY')}/bulan`,
        statusLabel: b.status === 'approved' ? 'Diluluskan' : b.status === 'pending' ? 'Dalam Semakan' : 'Tidak Diluluskan',
        statusTone: b.status === 'approved' ? 'emerald' : b.status === 'pending' ? 'amber' : 'bronze',
        detailLine: `Kategori: ${b.businessCategory === 'Makanan & Minuman (F&B)' ? 'Makanan & Minuman' : b.businessCategory} · Tarikh Mula: ${b.startDate || '-'} · Telefon: ${b.applicantPhone || '-'}`,
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
        userType: 'belia',
        userTypeLabel: 'Usahawan Belia',
        locationOrAgency: g.district || 'Kelantan',
        activitySummary: `Permohonan ${g.programTitle}`,
        metricDisplay: g.amount || g.grantAmount || 'RM 3,000',
        statusLabel: g.status === 'approved' ? 'Diluluskan' : g.status === 'pending' ? 'Dalam Semakan' : 'Tidak Diluluskan',
        statusTone: g.status === 'approved' ? 'emerald' : g.status === 'pending' ? 'amber' : 'bronze',
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
        locationOrAgency: m.agency || 'Hab Usahawan KBelia',
        activitySummary: m.expertise.slice(0, 2).join(', ') || 'Bimbingan Keusahawanan',
        metricDisplay: assignedSessions.length === 0 ? 'Belum Ada Sesi' : completedSessions === 0 ? `${assignedSessions.length} Sesi (Belum Selesai)` : `${assignedSessions.length} Sesi (${completedSessions} Selesai)`,
        statusLabel: 'Mentor',
        statusTone: 'emerald',
        detailLine: `Bidang: ${m.expertise.slice(0, 2).join(', ') || 'Bimbingan'} · Hubungan: ${m.email || m.phone}`,
        modifiedMs: getModifiedTimestamp(m)
      });
    });

    // 3. Penglibatan Forum Dalaman Mengikut Peranan (Belia / Mentor / Admin)
    communityPosts.forEach((post) => {
      const roleKey: Exclude<ReportUserTypeKey, 'all'> =
        post.authorRole === 'admin'
          ? 'admin'
          : post.authorRole === 'mentor'
          ? 'mentor'
          : 'belia';
      records.push({
        id: `usr-com-${post.id}`,
        displayName: post.authorName || (roleKey === 'admin' ? 'Admin Portal' : roleKey === 'mentor' ? 'Panel Mentor' : 'Usahawan Belia'),
        secondaryEntity: post.title,
        userType: roleKey,
        userTypeLabel: USER_TYPE_COLORS[roleKey].label,
        locationOrAgency: `${post.district} · ${post.category}`,
        activitySummary: `Perbincangan Portal (${post.category})`,
        metricDisplay: `${post.replyCount || 0} Balasan · ${post.helpfulCount || 0} Sokong`,
        statusLabel: post.status === 'resolved' ? 'Terjawab' : 'Aktif',
        statusTone: post.status === 'resolved' ? 'emerald' : 'blue',
        detailLine: post.content.slice(0, 160) + (post.content.length > 160 ? '...' : ''),
        modifiedMs: getModifiedTimestamp(post)
      });
    });

    // 4. Rekod Pentadbir Portal (Pentadbir Utama & Urusetia)
    const chiefAdminName = portalSettings?.adminOfficerName || 'Pentadbir Utama KBelia';
    records.push({
      id: 'usr-adm-chief',
      displayName: chiefAdminName,
      secondaryEntity: 'Pentadbir Utama Portal KBelia Kelantan',
      userType: 'admin',
      userTypeLabel: 'Pentadbir KBelia',
      locationOrAgency: 'Kompleks Kota Darulnaim, Kota Bharu',
      activitySummary: 'Pengurusan Kiosk & Geran Belia',
      metricDisplay: `${bookings.length + grantApplications.length} Semakan`,
      statusLabel: portalSettings?.systemStatus === 'maintenance' ? 'Penyelenggaraan' : 'Aktif',
      statusTone: portalSettings?.systemStatus === 'maintenance' ? 'amber' : 'bronze',
      detailLine: `Mengurus ${businesses.length} perniagaan belia berdaftar serta slot sewaan kiosk.`,
      modifiedMs: Date.now()
    });

    records.push({
      id: 'usr-adm-urusetia',
      displayName: 'Urusetia Pengurusan KBelia',
      secondaryEntity: 'Unit Pemantauan Program, Aduan & Berita Portal',
      userType: 'admin',
      userTypeLabel: 'Pentadbir KBelia',
      locationOrAgency: 'Unit Pembangunan Ekonomi Belia',
      activitySummary: `Seliaan ${programs.length} Program & ${maintenanceTickets.length} Aduan`,
      metricDisplay: `${programs.length} Program · ${newsItems.length} Berita`,
      statusLabel: 'Aktif',
      statusTone: 'bronze',
      detailLine: `Mengurus ${newsItems.length} pengumuman rasmi dan ${maintenanceTickets.length} laporan kerosakan kiosk.`,
      modifiedMs: Date.now() - 1000
    });

    return records;
  }, [
    businesses,
    bookings,
    grantApplications,
    mentors,
    mentorshipRegistrations,
    maintenanceTickets,
    programs,
    newsItems,
    communityPosts,
    portalSettings
  ]);

  const countsByType = useMemo(() => {
    const counts = {
      belia: 0,
      mentor: 0,
      admin: 0
    };
    consolidatedRecords.forEach((r) => {
      counts[r.userType] += 1;
    });
    return counts;
  }, [consolidatedRecords]);

  const totalCount = Math.max(1, consolidatedRecords.length);

  const animatedBeliaCount = useAnimatedMetric(countsByType.belia);
  const animatedMentorCount = useAnimatedMetric(countsByType.mentor);
  const animatedAdminCount = useAnimatedMetric(countsByType.admin);
  const animatedBeliaPct = useAnimatedMetric(`${Math.round((countsByType.belia / totalCount) * 100)}%`);
  const animatedMentorPct = useAnimatedMetric(`${Math.round((countsByType.mentor / totalCount) * 100)}%`);
  const animatedAdminPct = useAnimatedMetric(`${Math.round((countsByType.admin / totalCount) * 100)}%`);

  const donutChartData = useMemo(
    () =>
      (Object.keys(USER_TYPE_COLORS) as Array<Exclude<ReportUserTypeKey, 'all'>>).map((key) => ({
        key,
        name: USER_TYPE_COLORS[key].label,
        shortLabel:
          key === 'belia'
            ? 'Belia'
            : key === 'mentor'
            ? 'Mentor'
            : 'Admin',
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
    <section className={`relative overflow-hidden rounded-2xl border backdrop-blur-xs transition-colors ${adminTheme.surfaceClass}`}>
      {/* Header */}
      <div className={`px-4 py-4 sm:px-5 border-b ${adminTheme.dividerClass}`}>
        <div className="flex items-center gap-2.5">
          <FileText className={`w-5 h-5 ${adminTheme.accentTextClass}`} />
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-[#F5F2EC] tracking-tight">
            Ringkasan Pengguna Mengikut Peranan
          </h3>
        </div>
      </div>

      {/* Chart Zone (Unboxed single-elevation inside section) */}
      <div className={`p-4 sm:p-5 border-b ${adminTheme.dividerClass}`}>
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
          <div className="flex items-center gap-2">
            {chartMode === 'bar' ? (
              <BarChart3 className={`w-4 h-4 ${adminTheme.accentTextClass}`} />
            ) : (
              <PieChartIcon className={`w-4 h-4 ${adminTheme.accentTextClass}`} />
            )}
            <h4 className="text-base font-bold text-slate-900 dark:text-[#F5F2EC] tracking-tight">
              Komposisi Peranan Komuniti
            </h4>
          </div>
          <div className={`inline-flex items-center gap-1 p-1 rounded-xl border ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
            <button
              type="button"
              onClick={() => setChartMode('bar')}
              className={`px-2.5 py-1 rounded-xl text-[0.8125rem] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                chartMode === 'bar'
                  ? adminTheme.segmentedActiveClass
                  : 'text-slate-600 dark:text-stone-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Lajur
            </button>
            <button
              type="button"
              onClick={() => setChartMode('donut')}
              className={`px-2.5 py-1 rounded-xl text-[0.8125rem] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                chartMode === 'donut'
                  ? adminTheme.segmentedActiveClass
                  : 'text-slate-600 dark:text-stone-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Donut
            </button>
          </div>
        </div>

        <div className="relative h-[220px] min-h-[220px] w-full min-w-0 my-1 [&_.recharts-cartesian-axis-tick_text]:fill-slate-600 dark:[&_.recharts-cartesian-axis-tick_text]:fill-stone-300">
          <ResponsiveContainer width="100%" height={220} minWidth={0} initialDimension={{ width: 640, height: 220 }}>
            {chartMode === 'bar' ? (
              <BarChart
                data={donutChartData}
                barCategoryGap="24%"
                margin={{ top: 26, right: 20, left: -4, bottom: 6 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(168, 162, 158, 0.22)" />
                <XAxis dataKey="name" tick={{ fontSize: 12.5, fontWeight: 600 }} interval={0} axisLine={false} tickLine={false} />
                <YAxis domain={[0, (dataMax: number) => Math.max(dataMax, 4)]} allowDecimals={false} tick={{ fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(217, 138, 78, 0.10)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload as typeof donutChartData[number];
                      return (
                        <div className={`px-3.5 py-2 rounded-xl text-sm shadow-xl border ${adminTheme.tooltipBgClass}`}>
                          <div className="font-bold">{d.name}</div>
                          <div className="font-mono tabular-nums opacity-90">
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
                  fill={adminTheme.chartPrimary}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={72}
                  minPointSize={(val) => (Number(val) > 0 ? 6 : 0)}
                  isAnimationActive={!prefersReducedMotion}
                  animationDuration={650}
                  shape={(barProps: unknown) => (
                    <AnimatedShimmerBar
                      {...(barProps as AnimatedShimmerBarProps)}
                      radius={6}
                      reducedMotion={prefersReducedMotion}
                    />
                  )}
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
                    className="fill-slate-800 dark:fill-stone-200 font-mono"
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
                  isAnimationActive={!prefersReducedMotion}
                  animationDuration={650}
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
                        <div className={`px-3.5 py-2 rounded-xl text-sm shadow-xl border ${adminTheme.tooltipBgClass}`}>
                          <div className="font-bold">{d.name}</div>
                          <div className="font-mono tabular-nums opacity-90">
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
              <span className="text-[0.8125rem] font-semibold text-slate-600 dark:text-stone-300 truncate max-w-[125px]">
                {activeDonutFocus.label}
              </span>
              <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-[#F5F2EC] tabular-nums leading-tight">
                {activeDonutFocus.percentage}%
              </span>
              <span className="text-[0.8125rem] font-medium text-slate-600 dark:text-stone-400 tabular-nums">
                {activeDonutFocus.count} Rekod
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Hairline-Divided 3-Column Role Filter Strip (No Nested Card Boxes) */}
      <div className={`grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x ${adminTheme.dividerClass} border-b`}>
        <button
          type="button"
          onClick={() => setSelectedType(selectedType === 'belia' ? 'all' : 'belia')}
          className={`px-5 py-4 text-left transition-colors cursor-pointer flex flex-col justify-between gap-2 ${
            selectedType === 'belia'
              ? 'bg-[#10B981]/10 dark:bg-[#10B981]/14'
              : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-slate-800 dark:text-[#F5F2EC]">Usahawan Belia</span>
            <Store className="w-4 h-4 text-[#10B981] shrink-0" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-[#F5F2EC] tabular-nums leading-none">
              {animatedBeliaCount}
            </span>
            <span className="text-xs font-mono font-semibold text-[#0B6E52] dark:text-[#34D399] tabular-nums">
              {animatedBeliaPct}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-stone-400 leading-snug">
            {businesses.length} perniagaan · {bookings.length} tempahan · {grantApplications.length} sokongan
          </p>
        </button>

        <button
          type="button"
          onClick={() => setSelectedType(selectedType === 'mentor' ? 'all' : 'mentor')}
          className={`px-5 py-4 text-left transition-colors cursor-pointer flex flex-col justify-between gap-2 ${
            selectedType === 'mentor'
              ? 'bg-[#2563EB]/10 dark:bg-[#22D3EE]/12'
              : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-slate-800 dark:text-[#F5F2EC]">Panel Mentor</span>
            <GraduationCap className="w-4 h-4 text-[#2563EB] dark:text-[#38BDF8] shrink-0" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-[#F5F2EC] tabular-nums leading-none">
              {animatedMentorCount}
            </span>
            <span className="text-xs font-mono font-semibold text-[#1D4ED8] dark:text-[#38BDF8] tabular-nums">
              {animatedMentorPct}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-stone-400 leading-snug">
            {mentors.length} mentor · {mentorshipRegistrations.length} sesi bimbingan
          </p>
        </button>

        <button
          type="button"
          onClick={() => setSelectedType(selectedType === 'admin' ? 'all' : 'admin')}
          className={`px-5 py-4 text-left transition-colors cursor-pointer flex flex-col justify-between gap-2 ${
            selectedType === 'admin'
              ? 'bg-[#D98A4E]/12 dark:bg-[#D98A4E]/15'
              : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-slate-800 dark:text-[#F5F2EC]">Pentadbir KBelia</span>
            <ShieldCheck className="w-4 h-4 text-[#9A5628] dark:text-[#D98A4E] shrink-0" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-[#F5F2EC] tabular-nums leading-none">
              {animatedAdminCount}
            </span>
            <span className="text-xs font-mono font-semibold text-[#9A5628] dark:text-[#D98A4E] tabular-nums">
              {animatedAdminPct}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-stone-400 leading-snug">
            Urusetia &amp; admin · {programs.length} program · {newsItems.length} berita
          </p>
        </button>
      </div>

      {/* Unified User-Type Data Table */}
      <div className="overflow-visible">
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
              <label className="block text-[0.8125rem] font-semibold text-slate-700 dark:text-stone-300 mb-1.5">
                Peranan Komuniti
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {(
                  [
                    { id: 'all', label: `Semua (${consolidatedRecords.length})` },
                    { id: 'belia', label: `Usahawan Belia (${countsByType.belia})` },
                    { id: 'mentor', label: `Panel Mentor (${countsByType.mentor})` },
                    { id: 'admin', label: `Pentadbir (${countsByType.admin})` }
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedType(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-[0.8125rem] font-semibold border text-left transition-colors cursor-pointer ${
                      selectedType === tab.id
                        ? `${adminTheme.primaryButtonClass} border-transparent`
                        : `${adminTheme.secondaryButtonClass}`
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
            <Users className="w-8 h-8 text-slate-400 dark:text-stone-500 mx-auto" />
            <p className="text-sm font-bold text-slate-900 dark:text-[#F5F2EC]">Tiada Rekod Dijumpai</p>
            <p className="text-sm text-slate-600 dark:text-stone-400">
              Cuba pilih peranan lain atau tukar kata kunci carian anda.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className={`${adminTheme.surfaceMutedClass} border-b ${adminTheme.dividerClass} text-[0.8125rem] font-semibold text-slate-600 dark:text-stone-400`}>
                    <th className="py-3 pl-4 pr-2 w-12 text-center">Bil</th>
                    <th className="py-3 px-3">Nama &amp; Entiti</th>
                    <th className="py-3 px-3">Peranan</th>
                    <th className="py-3 px-3">Lokasi / Agensi</th>
                    <th className="py-3 px-3">Ringkasan Aktiviti</th>
                    <th className="py-3 px-3 text-right">Catatan</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 pl-2 pr-4 w-12 text-right">
                      <span className="sr-only">Tindakan</span>
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${adminTheme.dividerClass} text-slate-900 dark:text-[#F5F2EC]`}>
                  {pagination.paginatedItems.map((rec, idx) => {
                    const rowNumber = (pagination.currentPage - 1) * 6 + idx + 1;
                    const isExpanded = expandedRowId === rec.id;
                    const typeTextTone = USER_TYPE_COLORS[rec.userType].textTone;
                    const statusTextTone =
                      rec.statusTone === 'emerald'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : rec.statusTone === 'amber'
                        ? 'text-amber-700 dark:text-amber-400'
                        : rec.statusTone === 'blue'
                        ? 'text-sky-700 dark:text-sky-400'
                        : 'text-[#9A5628] dark:text-[#D98A4E]';

                    return (
                      <React.Fragment key={rec.id}>
                        <tr className="kbelia-table-row">
                          <td className="py-3.5 pl-4 pr-2 text-center font-mono text-slate-500 dark:text-stone-400 tabular-nums">
                            {rowNumber}
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="font-semibold text-slate-900 dark:text-[#F5F2EC] leading-snug">
                              {rec.displayName}
                            </div>
                            <div className="text-[0.8125rem] text-slate-500 dark:text-stone-400 truncate max-w-[220px]">
                              {rec.secondaryEntity}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <span className={`text-[0.8125rem] font-semibold ${typeTextTone}`}>
                              {rec.userTypeLabel}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-slate-600 dark:text-stone-300 whitespace-nowrap">
                            {rec.locationOrAgency}
                          </td>
                          <td className="py-3.5 px-3 text-slate-700 dark:text-stone-300 max-w-[240px]">
                            <span className="line-clamp-2">{rec.activitySummary}</span>
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-[#F5F2EC] tabular-nums whitespace-nowrap">
                            {rec.metricDisplay}
                          </td>
                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            <span className={`text-[0.8125rem] font-semibold ${statusTextTone}`}>
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
                          <tr className={adminTheme.surfaceMutedClass}>
                            <td colSpan={8} className={`px-6 py-3.5 text-sm text-slate-700 dark:text-stone-200 border-t ${adminTheme.dividerClass}`}>
                              <span className="font-semibold mr-2">Butiran Ringkas:</span>
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
              itemLabel="rekod"
            />
          </>
        )}
      </div>
    </section>
  );
};
