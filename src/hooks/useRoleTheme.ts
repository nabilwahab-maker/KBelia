import { useAuth } from '../context/AuthContext';
import { DashboardRole, getRoleTheme, RoleThemeConfig } from '../utils/roleTheme';

export function useRoleTheme(): {
  role: DashboardRole;
  theme: RoleThemeConfig;
  toolbarAccent: 'emerald' | 'blue' | 'amber';
  paginationAccent: 'teal' | 'blue' | 'amber';
} {
  const { userProfile, isAdmin } = useAuth();
  const role: DashboardRole = isAdmin
    ? 'admin'
    : userProfile?.role === 'mentor'
    ? 'mentor'
    : 'belia';

  const theme = getRoleTheme(role);
  const toolbarAccent = role === 'admin' ? 'amber' : role === 'mentor' ? 'blue' : 'emerald';
  const paginationAccent = role === 'admin' ? 'amber' : role === 'mentor' ? 'blue' : 'teal';

  return { role, theme, toolbarAccent, paginationAccent };
}
