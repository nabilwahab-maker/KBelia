export type DashboardRole = 'belia' | 'mentor' | 'admin';

export function getDashboardRole(isAdmin?: boolean, isMentor?: boolean): DashboardRole {
  if (isAdmin) return 'admin';
  if (isMentor) return 'mentor';
  return 'belia';
}

export interface RoleThemeConfig {
  canvasClass: string;
  sidebarBgClass: string;
  topbarBgClass: string;
  surfaceClass: string;
  surfaceMutedClass: string;
  dividerClass: string;
  accentTextClass: string;
  accentStrongTextClass: string;
  primaryButtonClass: string;
  secondaryButtonClass: string;
  compactPrimaryButtonClass: string;
  compactSecondaryButtonClass: string;
  dangerButtonClass: string;
  dangerOutlineButtonClass: string;
  iconButtonClass: string;
  activeNavClass: string;
  activeSubNavClass: string;
  activeMiniBtnClass: string;
  badgeClass: string;
  badgeOnActiveClass: string;
  segmentedActiveClass: string;
  chartPrimary: string;
  chartSecondary: string;
  chartTertiary: string;
  chartNeutral: string;
  tooltipBgClass: string;
  progressFillClass: string;
  inputClass: string;
  tabActiveUnderlineClass: string;
  tabIdleUnderlineClass: string;
  rowHoverClass: string;
}

const SHARED_BUTTON_BASE =
  'rounded-xl font-semibold transition-colors whitespace-nowrap shrink-0 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1';

const SHARED_DANGER_BTN =
  `${SHARED_BUTTON_BASE} bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500 text-white shadow-2xs focus-visible:ring-rose-500/40`;

const SHARED_DANGER_OUTLINE_BTN =
  `${SHARED_BUTTON_BASE} bg-white/85 hover:bg-rose-50 dark:bg-[#1D1214] dark:hover:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/70 focus-visible:ring-rose-500/30`;

export const ROLE_THEMES: Record<DashboardRole, RoleThemeConfig> = {
  belia: {
    canvasClass: 'kbelia-canvas-belia',
    sidebarBgClass: 'bg-[#FAF8F3] dark:bg-[#0D1311] border-[#E4DEC9] dark:border-[#1E2B25]',
    topbarBgClass: 'bg-[#FAF8F3]/95 dark:bg-[#0E1512]/95 border-[#E4DEC9] dark:border-[#1E2B25]',
    surfaceClass: 'bg-white/90 dark:bg-[#141D1A]/85 border-[#E2DCCB] dark:border-[#24342D]',
    surfaceMutedClass: 'bg-[#F5F2EA]/75 dark:bg-[#101815]/80',
    dividerClass: 'divide-[#E6E0D0] dark:divide-[#24342D] border-[#E6E0D0] dark:border-[#24342D]',
    accentTextClass: 'text-[#0B6E52] dark:text-[#34D399]',
    accentStrongTextClass: 'text-[#B47B1E] dark:text-[#E5B85C]',
    primaryButtonClass: 'bg-[#0B6E52] hover:bg-[#095A43] dark:bg-[#10B981] dark:hover:bg-[#059669] text-white dark:text-[#08120E] rounded-xl font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer',
    secondaryButtonClass: 'bg-white/85 hover:bg-[#F5F2EA] dark:bg-[#17221E] dark:hover:bg-[#1E2C27] text-[#16221D] dark:text-[#F4F1EA] border border-[#DDD5C0] dark:border-[#2A3C34] rounded-xl font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer',
    compactPrimaryButtonClass: `${SHARED_BUTTON_BASE} px-3.5 py-2 text-[0.8125rem] bg-[#0B6E52] hover:bg-[#095A43] dark:bg-[#10B981] dark:hover:bg-[#059669] text-white dark:text-[#08120E] focus-visible:ring-[#10B981]/35`,
    compactSecondaryButtonClass: `${SHARED_BUTTON_BASE} px-3.5 py-2 text-[0.8125rem] bg-white/85 hover:bg-[#F5F2EA] dark:bg-[#17221E] dark:hover:bg-[#1E2C27] text-[#16221D] dark:text-[#F4F1EA] border border-[#DDD5C0] dark:border-[#2A3C34] focus-visible:ring-[#10B981]/25`,
    dangerButtonClass: SHARED_DANGER_BTN,
    dangerOutlineButtonClass: SHARED_DANGER_OUTLINE_BTN,
    iconButtonClass: 'w-9 h-9 rounded-xl border border-[#DDD5C0] dark:border-[#2A3C34] bg-white/85 dark:bg-[#17221E] text-[#16221D] dark:text-[#F4F1EA] hover:bg-[#F5F2EA] dark:hover:bg-[#1E2C27] inline-flex items-center justify-center shrink-0 transition-colors cursor-pointer',
    activeNavClass: 'bg-gradient-to-r from-[#0B6E52]/12 via-[#0B6E52]/6 to-[#E5B85C]/12 dark:from-[#10B981]/20 dark:via-[#10B981]/10 dark:to-[#E5B85C]/15 text-[#0F241C] dark:text-[#F4F1EA] border-[#0B6E52]/30 dark:border-[#34D399]/35 font-semibold',
    activeSubNavClass: 'bg-[#0B6E52] dark:bg-gradient-to-r dark:from-[#10B981]/90 dark:to-[#059669] text-white dark:text-[#07130F] font-semibold',
    activeMiniBtnClass: 'bg-[#0B6E52]/12 dark:bg-[#10B981]/20 text-[#0B6E52] dark:text-[#34D399] border-[#0B6E52]/35 dark:border-[#34D399]/40',
    badgeClass: 'bg-[#0B6E52] text-white dark:bg-[#E5B85C] dark:text-[#101614]',
    badgeOnActiveClass: 'bg-white/95 text-[#0B6E52] dark:bg-[#08120E]/85 dark:text-[#E5B85C]',
    segmentedActiveClass: 'bg-[#0B6E52] dark:bg-[#10B981] text-white dark:text-[#08120E] font-semibold',
    chartPrimary: '#10B981',
    chartSecondary: '#E5B85C',
    chartTertiary: '#059669',
    chartNeutral: '#64748B',
    tooltipBgClass: 'bg-[#101614] border-[#293B33] text-[#F4F1EA]',
    progressFillClass: 'bg-[#10B981] dark:bg-[#34D399]',
    inputClass: 'bg-white/80 dark:bg-[#0F1714]/85 border border-[#DDD5C0] dark:border-[#24342D] text-[#16221D] dark:text-[#F4F1EA] placeholder:text-slate-400 dark:placeholder:text-stone-500 focus:border-[#0B6E52] dark:focus:border-[#34D399] focus:ring-2 focus:ring-[#10B981]/20',
    tabActiveUnderlineClass: 'border-[#0B6E52] dark:border-[#34D399] text-[#0F241C] dark:text-[#F4F1EA]',
    tabIdleUnderlineClass: 'border-transparent text-slate-500 dark:text-stone-400 hover:text-slate-900 dark:hover:text-[#F4F1EA]',
    rowHoverClass: 'hover:bg-[#F5F2EA]/70 dark:hover:bg-[#18241F]/65'
  },
  mentor: {
    canvasClass: 'kbelia-canvas-mentor',
    sidebarBgClass: 'bg-[#F8FAFC] dark:bg-[#0B1117] border-[#DCE5F0] dark:border-[#1B2A3A]',
    topbarBgClass: 'bg-[#F8FAFC]/95 dark:bg-[#0C1219]/95 border-[#DCE5F0] dark:border-[#1B2A3A]',
    surfaceClass: 'bg-white/90 dark:bg-[#111A23]/85 border-[#DCE5F0] dark:border-[#213345]',
    surfaceMutedClass: 'bg-[#F1F5F9]/80 dark:bg-[#0E161E]/80',
    dividerClass: 'divide-[#E1E9F2] dark:divide-[#213345] border-[#E1E9F2] dark:border-[#213345]',
    accentTextClass: 'text-[#1D4ED8] dark:text-[#38BDF8]',
    accentStrongTextClass: 'text-[#0E7490] dark:text-[#22D3EE]',
    primaryButtonClass: 'bg-[#1D4ED8] hover:bg-[#1E40AF] dark:bg-[#0EA5E9] dark:hover:bg-[#38BDF8] text-white dark:text-[#07111A] rounded-xl font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer',
    secondaryButtonClass: 'bg-white/85 hover:bg-[#EEF4FA] dark:bg-[#15212D] dark:hover:bg-[#1C2C3B] text-[#0F1E2E] dark:text-[#F1F6FA] border border-[#D4DFEC] dark:border-[#263B50] rounded-xl font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer',
    compactPrimaryButtonClass: `${SHARED_BUTTON_BASE} px-3.5 py-2 text-[0.8125rem] bg-[#1D4ED8] hover:bg-[#1E40AF] dark:bg-[#0EA5E9] dark:hover:bg-[#38BDF8] text-white dark:text-[#07111A] focus-visible:ring-[#38BDF8]/35`,
    compactSecondaryButtonClass: `${SHARED_BUTTON_BASE} px-3.5 py-2 text-[0.8125rem] bg-white/85 hover:bg-[#EEF4FA] dark:bg-[#15212D] dark:hover:bg-[#1C2C3B] text-[#0F1E2E] dark:text-[#F1F6FA] border border-[#D4DFEC] dark:border-[#263B50] focus-visible:ring-[#38BDF8]/25`,
    dangerButtonClass: SHARED_DANGER_BTN,
    dangerOutlineButtonClass: SHARED_DANGER_OUTLINE_BTN,
    iconButtonClass: 'w-9 h-9 rounded-xl border border-[#D4DFEC] dark:border-[#263B50] bg-white/85 dark:bg-[#15212D] text-[#0F1E2E] dark:text-[#F1F6FA] hover:bg-[#EEF4FA] dark:hover:bg-[#1C2C3B] inline-flex items-center justify-center shrink-0 transition-colors cursor-pointer',
    activeNavClass: 'bg-gradient-to-r from-[#2563EB]/12 via-[#2563EB]/6 to-[#22D3EE]/12 dark:from-[#2563EB]/25 dark:via-[#0EA5E9]/15 dark:to-[#22D3EE]/15 text-[#0F1E2E] dark:text-[#F1F6FA] border-[#2563EB]/30 dark:border-[#38BDF8]/35 font-semibold',
    activeSubNavClass: 'bg-[#1D4ED8] dark:bg-gradient-to-r dark:from-[#2563EB] dark:to-[#0EA5E9] text-white font-semibold',
    activeMiniBtnClass: 'bg-[#2563EB]/12 dark:bg-[#38BDF8]/20 text-[#1D4ED8] dark:text-[#38BDF8] border-[#2563EB]/35 dark:border-[#38BDF8]/40',
    badgeClass: 'bg-[#1D4ED8] text-white dark:bg-[#22D3EE] dark:text-[#08121B]',
    badgeOnActiveClass: 'bg-white/95 text-[#1D4ED8] dark:bg-[#0B1117]/85 dark:text-[#22D3EE]',
    segmentedActiveClass: 'bg-[#1D4ED8] dark:bg-[#0EA5E9] text-white dark:text-[#07111A] font-semibold',
    chartPrimary: '#2563EB',
    chartSecondary: '#22D3EE',
    chartTertiary: '#CBD5E1',
    chartNeutral: '#64748B',
    tooltipBgClass: 'bg-[#0E151C] border-[#23374A] text-[#F1F6FA]',
    progressFillClass: 'bg-[#2563EB] dark:bg-[#22D3EE]',
    inputClass: 'bg-white/80 dark:bg-[#0D141C]/85 border border-[#D4DFEC] dark:border-[#213345] text-[#0F1E2E] dark:text-[#F1F6FA] placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#1D4ED8] dark:focus:border-[#38BDF8] focus:ring-2 focus:ring-[#38BDF8]/20',
    tabActiveUnderlineClass: 'border-[#1D4ED8] dark:border-[#38BDF8] text-[#0F1E2E] dark:text-[#F1F6FA]',
    tabIdleUnderlineClass: 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-[#F1F6FA]',
    rowHoverClass: 'hover:bg-[#EEF4FA]/70 dark:hover:bg-[#172330]/65'
  },
  admin: {
    canvasClass: 'kbelia-canvas-admin',
    sidebarBgClass: 'bg-[#FAF8F5] dark:bg-[#100F0E] border-[#E5DFD5] dark:border-[#2A2623]',
    topbarBgClass: 'bg-[#FAF8F5]/95 dark:bg-[#121110]/95 border-[#E5DFD5] dark:border-[#2A2623]',
    surfaceClass: 'bg-white/90 dark:bg-[#1A1816]/88 border-[#E3DDD2] dark:border-[#2E2A26]',
    surfaceMutedClass: 'bg-[#F5F2EC]/80 dark:bg-[#151311]/85',
    dividerClass: 'divide-[#E6E0D6] dark:divide-[#2E2A26] border-[#E6E0D6] dark:border-[#2E2A26]',
    accentTextClass: 'text-[#9A5628] dark:text-[#D98A4E]',
    accentStrongTextClass: 'text-[#4D6B57] dark:text-[#96B09A]',
    primaryButtonClass: 'bg-[#9A5628] hover:bg-[#7D451F] dark:bg-[#D98A4E] dark:hover:bg-[#E49A61] text-white dark:text-[#141312] rounded-xl font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer',
    secondaryButtonClass: 'bg-white/85 hover:bg-[#F3EFE8] dark:bg-[#211E1B] dark:hover:bg-[#2A2622] text-[#231F1C] dark:text-[#F5F2EC] border border-[#DDD6CA] dark:border-[#37322D] rounded-xl font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer',
    compactPrimaryButtonClass: `${SHARED_BUTTON_BASE} px-3.5 py-2 text-[0.8125rem] bg-[#9A5628] hover:bg-[#7D451F] dark:bg-[#D98A4E] dark:hover:bg-[#E49A61] text-white dark:text-[#141312] focus-visible:ring-[#D98A4E]/35`,
    compactSecondaryButtonClass: `${SHARED_BUTTON_BASE} px-3.5 py-2 text-[0.8125rem] bg-white/85 hover:bg-[#F3EFE8] dark:bg-[#211E1B] dark:hover:bg-[#2A2622] text-[#231F1C] dark:text-[#F5F2EC] border border-[#DDD6CA] dark:border-[#37322D] focus-visible:ring-[#D98A4E]/25`,
    dangerButtonClass: SHARED_DANGER_BTN,
    dangerOutlineButtonClass: SHARED_DANGER_OUTLINE_BTN,
    iconButtonClass: 'w-9 h-9 rounded-xl border border-[#DDD6CA] dark:border-[#37322D] bg-white/85 dark:bg-[#211E1B] text-[#231F1C] dark:text-[#F5F2EC] hover:bg-[#F3EFE8] dark:hover:bg-[#2A2622] inline-flex items-center justify-center shrink-0 transition-colors cursor-pointer',
    activeNavClass: 'bg-gradient-to-r from-[#D98A4E]/16 via-[#D98A4E]/8 to-[#A8A29E]/10 dark:from-[#D98A4E]/22 dark:via-[#D98A4E]/10 dark:to-transparent text-[#231F1C] dark:text-[#F5F2EC] border-[#9A5628]/30 dark:border-[#D98A4E]/40 font-semibold',
    activeSubNavClass: 'bg-[#9A5628] dark:bg-gradient-to-r dark:from-[#D98A4E] dark:to-[#B86E38] text-white dark:text-[#141312] font-semibold',
    activeMiniBtnClass: 'bg-[#9A5628]/12 dark:bg-[#D98A4E]/20 text-[#9A5628] dark:text-[#D98A4E] border-[#9A5628]/35 dark:border-[#D98A4E]/40',
    badgeClass: 'bg-[#9A5628] text-white dark:bg-[#D98A4E] dark:text-[#141312]',
    badgeOnActiveClass: 'bg-white/95 text-[#9A5628] dark:bg-[#141312]/85 dark:text-[#D98A4E]',
    segmentedActiveClass: 'bg-[#9A5628] dark:bg-[#D98A4E] text-white dark:text-[#141312] font-semibold',
    chartPrimary: '#D98A4E',
    chartSecondary: '#78907C',
    chartTertiary: '#A8A29E',
    chartNeutral: '#57534E',
    tooltipBgClass: 'bg-[#141312] border-[#332E2A] text-[#F5F2EC]',
    progressFillClass: 'bg-[#9A5628] dark:bg-[#D98A4E]',
    inputClass: 'bg-white/80 dark:bg-[#141210]/85 border border-[#DDD6CA] dark:border-[#2E2A26] text-[#231F1C] dark:text-[#F5F2EC] placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:border-[#9A5628] dark:focus:border-[#D98A4E] focus:ring-2 focus:ring-[#D98A4E]/20',
    tabActiveUnderlineClass: 'border-[#9A5628] dark:border-[#D98A4E] text-[#231F1C] dark:text-[#F5F2EC]',
    tabIdleUnderlineClass: 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-[#F5F2EC]',
    rowHoverClass: 'hover:bg-[#F3EFE8]/75 dark:hover:bg-[#23201C]/70'
  }
};

export function getRoleTheme(role: DashboardRole): RoleThemeConfig {
  return ROLE_THEMES[role] || ROLE_THEMES.belia;
}
