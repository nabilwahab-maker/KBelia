import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  Plus,
  X,
  Save,
  Loader2,
  AlertCircle,
  ArrowUpDown
} from 'lucide-react';
import { KelantanDistrict, UserProfile, UserRole } from '../types';
import {
  savePortalUserRecord,
  deletePortalUserRecord,
  subscribePortalUsers
} from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { useConfirmDelete } from '../context/ConfirmDeleteContext';
import { showToast } from './ToastNotification';
import { PaginationBar, usePagination } from './PaginationBar';
import { ReferenceTableToolbar, RowActionMenu } from './ReferenceTableKit';
import { DEFAULT_SORT_VALUE, buildStandardSortOptions, compareText, sortRecords } from '../utils/sortUtils';

const DISTRICTS: KelantanDistrict[] = [
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

const ROLE_LABELS: Record<UserRole, string> = {
  user: 'Usahawan Belia',
  mentor: 'Mentor',
  admin: 'Pentadbir Sistem'
};

interface AdminUsersManagerProps {
  onRefresh?: () => void;
}

export const AdminUsersManager: React.FC<AdminUsersManagerProps> = ({ onRefresh }) => {
  const { user, isAdmin } = useAuth();
  const { confirmDelete } = useConfirmDelete();

  const [portalUsers, setPortalUsers] = useState<UserProfile[]>([]);
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>(DEFAULT_SORT_VALUE);
  const [sortConfig, setSortConfig] = useState<{ key: 'fullName' | 'role' | 'district'; dir: 'asc' | 'desc' }>({
    key: 'fullName',
    dir: 'asc'
  });

  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('Kota Bharu');
  const [role, setRole] = useState<UserRole>('user');
  const [businessName, setBusinessName] = useState('');
  const [ssmNumber, setSsmNumber] = useState('');
  const [institution, setInstitution] = useState('');
  const [designation, setDesignation] = useState('');
  const [mentorId, setMentorId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribePortalUsers(isAdmin, (loaded) => {
      setPortalUsers(loaded);
    });
    return () => unsub();
  }, [isAdmin]);

  const nonAdminUsers = useMemo(
    () => portalUsers.filter((u) => u.role !== 'admin'),
    [portalUsers]
  );

  const userSortOptions = useMemo(
    () =>
      buildStandardSortOptions(
        [
          { value: 'role_asc', label: 'Peranan Akaun (A - Z)' },
          { value: 'district_asc', label: 'Daerah (A - Z)' }
        ]
      ),
    []
  );

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = nonAdminUsers.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (districtFilter !== 'Semua' && (u.district || 'Kota Bharu') !== districtFilter) return false;
      if (!q) return true;
      return (
        (u.fullName || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.businessName || '').toLowerCase().includes(q) ||
        (u.district || '').toLowerCase().includes(q)
      );
    });

    if (sortBy === 'table_column') {
      const dirMult = sortConfig.dir === 'asc' ? 1 : -1;
      return [...filtered].sort((a, b) => {
        if (sortConfig.key === 'role') {
          return (ROLE_LABELS[a.role] || '').localeCompare(ROLE_LABELS[b.role] || '') * dirMult;
        }
        if (sortConfig.key === 'district') {
          return (a.district || 'Kota Bharu').localeCompare(b.district || 'Kota Bharu') * dirMult;
        }
        return (a.fullName || '').localeCompare(b.fullName || '') * dirMult;
      });
    }

    return sortRecords(filtered, {
      sortBy,
      getName: (u) => u.fullName || u.email || '',
      customCompare: (a, b, mode) => {
        if (mode === 'role_asc') return compareText(ROLE_LABELS[a.role], ROLE_LABELS[b.role]);
        if (mode === 'district_asc') return compareText(a.district || 'Kota Bharu', b.district || 'Kota Bharu');
        return null;
      }
    });
  }, [nonAdminUsers, roleFilter, districtFilter, searchQuery, sortBy, sortConfig]);

  const pagination = usePagination(filteredUsers, 7, [
    roleFilter,
    districtFilter,
    searchQuery,
    sortBy,
    sortConfig.key,
    sortConfig.dir,
    filteredUsers.length
  ]);

  const activeFilterCount =
    (roleFilter !== 'all' ? 1 : 0) +
    (districtFilter !== 'Semua' ? 1 : 0) +
    (sortBy !== DEFAULT_SORT_VALUE ? 1 : 0);

  const toggleSort = (key: 'fullName' | 'role' | 'district') => {
    setSortBy('table_column');
    setSortConfig((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    );
  };

  const counts = useMemo(
    () => ({
      all: nonAdminUsers.length,
      user: nonAdminUsers.filter((u) => u.role === 'user').length,
      mentor: nonAdminUsers.filter((u) => u.role === 'mentor').length
    }),
    [nonAdminUsers]
  );

  const isCurrentActiveUser = (target: UserProfile) => {
    if (!user) return false;
    return (
      target.userId === user.uid ||
      (Boolean(user.email) && target.email.toLowerCase() === user.email!.toLowerCase())
    );
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFullName('');
    setEmail('');
    setPhone('');
    setDistrict('Kota Bharu');
    setRole('user');
    setBusinessName('');
    setSsmNumber('');
    setInstitution('');
    setDesignation('');
    setMentorId('');
    setFormError(null);
    setShowUserModal(true);
  };

  const openEditModal = (u: UserProfile) => {
    setEditingUser(u);
    setFullName(u.fullName || '');
    setEmail(u.email || '');
    setPhone(u.phone || '');
    setDistrict(u.district || 'Kota Bharu');
    setRole(u.role || 'user');
    setBusinessName(u.businessName || '');
    setSsmNumber(u.ssmNumber || '');
    setInstitution(u.institution || '');
    setDesignation(u.designation || '');
    setMentorId(u.mentorId || '');
    setFormError(null);
    setShowUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!fullName.trim() || !email.trim()) {
      setFormError('Sila masukkan nama penuh dan alamat emel pengguna.');
      return;
    }

    const effectiveRole: UserRole = editingUser
      ? editingUser.role
      : role === 'mentor'
      ? 'mentor'
      : 'user';

    setIsSaving(true);
    try {
      await savePortalUserRecord({
        ...(editingUser || {}),
        userId: editingUser?.userId,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        district,
        role: effectiveRole,
        businessName: businessName.trim(),
        ssmNumber: ssmNumber.trim(),
        institution: institution.trim(),
        designation: designation.trim(),
        mentorId: effectiveRole === 'mentor' ? mentorId.trim() || editingUser?.mentorId || 'mentor-1' : undefined
      });
      showToast(
        editingUser ? 'Maklumat akaun pengguna berjaya dikemas kini!' : 'Akaun pengguna baharu berjaya ditambah!',
        'success'
      );
      setShowUserModal(false);
      setEditingUser(null);
      onRefresh?.();
    } catch {
      setFormError('Gagal menyimpan maklumat akaun pengguna. Sila cuba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (target: UserProfile) => {
    if (isCurrentActiveUser(target)) {
      showToast('Anda tidak boleh memadam akaun anda sendiri semasa sesi aktif.', 'warning');
      return;
    }
    try {
      await deletePortalUserRecord(target.userId);
      showToast(`Akaun ${target.fullName} berjaya dipadam.`, 'info');
      onRefresh?.();
    } catch {
      showToast('Gagal memadam akaun pengguna.', 'error');
    }
  };

  return (
    <div className="space-y-4 animate-dashboard-tab">
      {/* Header */}
      <div className="kbelia-important-header relative overflow-hidden p-4 sm:p-5 rounded-2xl border border-slate-300 dark:border-slate-600 shadow-xs">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-indigo-500/80 dark:bg-indigo-400/80" />
        <div className="space-y-1">
          <h3 className="text-xl sm:text-2xl font-extrabold text-black dark:text-white tracking-tight">
            Pengurusan Akaun &amp; Profil Pengguna Portal
          </h3>
        </div>
      </div>

      {/* Reference-Style Users Table Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-2xs overflow-visible">
        <ReferenceTableToolbar
          accent="indigo"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Cari nama, emel atau perniagaan..."
          filterCount={activeFilterCount}
          onResetFilters={() => {
            setRoleFilter('all');
            setDistrictFilter('Semua');
            setSortBy(DEFAULT_SORT_VALUE);
          }}
          sortOptions={
            sortBy === 'table_column'
              ? [{ value: '', label: 'Ikut Lajur Jadual' }, ...userSortOptions]
              : userSortOptions
          }
          sortValue={sortBy === 'table_column' ? '' : sortBy}
          onSortChange={(val) => {
            if (val) setSortBy(val);
          }}
          rightSlot={
            <button
              type="button"
              onClick={openCreateModal}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Pengguna Baharu</span>
            </button>
          }
          filterContent={
            <>
              <div>
                <label className="block text-[0.8125rem] font-bold uppercase tracking-wider text-black/65 dark:text-white/70 mb-1.5">
                  Peranan Akaun
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {([
                    { id: 'all', label: `Semua (${counts.all})` },
                    { id: 'user', label: `Usahawan Belia (${counts.user})` },
                    { id: 'mentor', label: `Mentor (${counts.mentor})` }
                  ] as const).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setRoleFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-[0.8125rem] font-semibold border text-left transition-colors cursor-pointer ${
                        roleFilter === tab.id
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 dark:bg-zinc-950 text-black dark:text-white border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[0.8125rem] font-bold uppercase tracking-wider text-black/65 dark:text-white/70 mb-1.5">
                  Daerah
                </label>
                <select
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white font-medium cursor-pointer"
                >
                  <option value="Semua">Semua Daerah</option>
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </>
          }
        />

        {pagination.paginatedItems.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Users className="w-9 h-9 text-black/30 dark:text-white/30 mx-auto" />
            <p className="text-sm font-bold text-black dark:text-white">
              Tiada rekod akaun pengguna sepadan dengan tapisan semasa.
            </p>
            {(searchQuery || activeFilterCount > 0) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('all');
                  setDistrictFilter('Semua');
                }}
                className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Set Semula Carian &amp; Penapis
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 dark:bg-zinc-950/90 border-b border-slate-200 dark:border-zinc-700 text-[0.8125rem] font-semibold text-black/65 dark:text-white/70">
                    <th className="py-3 pl-4 pr-3">
                      <button
                        type="button"
                        onClick={() => toggleSort('fullName')}
                        className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                      >
                        <span>Pengguna</span>
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                      </button>
                    </th>
                    <th className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => toggleSort('role')}
                        className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                      >
                        <span>Peranan</span>
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                      </button>
                    </th>
                    <th className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => toggleSort('district')}
                        className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                      >
                        <span>Daerah</span>
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                      </button>
                    </th>
                    <th className="py-3 px-3">Organisasi / Perniagaan</th>
                    <th className="py-3 px-3">Hubungi</th>
                    <th className="py-3 pl-2 pr-4 w-12 text-right">
                      <span className="sr-only">Tindakan</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-zinc-700 text-black dark:text-white">
                  {pagination.paginatedItems.map((u) => {
                    const isSelf = isCurrentActiveUser(u);
                    const orgLabel =
                      u.role === 'user'
                        ? u.businessName || 'Belum daftar perniagaan'
                        : u.role === 'mentor'
                        ? u.institution || 'Hab Usahawan / Rakan Industri'
                        : u.designation || 'Pentadbir Portal KBelia';

                    return (
                      <tr key={u.userId} className="kbelia-table-row">
                        <td className="py-3.5 pl-4 pr-3">
                          <div className="flex items-center gap-3 min-w-[200px]">
                            <img
                              src={u.avatarUrl || '/assets/generated/avatar_youth_male_1793924250192.jpg'}
                              alt={u.fullName}
                              className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-zinc-700 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="font-semibold text-black dark:text-white truncate max-w-[220px]">
                                {u.fullName}
                                {isSelf ? ' (Anda)' : ''}
                              </div>
                              <div className="text-[0.8125rem] text-black/65 dark:text-white/70 truncate max-w-[220px]">
                                {u.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.8125rem] font-semibold border ${
                              u.role === 'mentor'
                                ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800/70 text-teal-800 dark:text-teal-200'
                                : 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800/70 text-blue-800 dark:text-blue-200'
                            }`}
                          >
                            {ROLE_LABELS[u.role] || 'Usahawan Belia'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-black/75 dark:text-white/80 whitespace-nowrap">
                          {u.district || 'Kota Bharu'}
                        </td>
                        <td className="py-3.5 px-3 text-black/80 dark:text-white/85 max-w-[220px] truncate">
                          {orgLabel}
                        </td>
                        <td className="py-3.5 px-3 text-black/70 dark:text-white/75 font-mono text-[0.8125rem] tabular-nums whitespace-nowrap">
                          {u.phone || '-'}
                        </td>
                        <td className="py-3.5 pl-2 pr-4 text-right">
                          <RowActionMenu
                            ariaLabel={`Tindakan untuk ${u.fullName}`}
                            items={[
                              {
                                label: 'Edit Profil',
                                onClick: () => openEditModal(u)
                              },
                              {
                                label: 'Padam Akaun',
                                tone: 'danger',
                                dividerBefore: true,
                                disabled: isSelf,
                                onClick: () =>
                                  confirmDelete({
                                    itemName: `${u.fullName} (${u.email})`,
                                    itemType: 'Akaun Pengguna',
                                    description: 'Akaun yang dipadam akan dikeluarkan daripada senarai pengguna aktif portal.',
                                    onConfirm: () => handleDeleteUser(u)
                                  })
                              }
                            ]}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <PaginationBar
              currentPage={pagination.currentPage}
              totalItems={pagination.totalItems}
              itemsPerPage={7}
              onPageChange={pagination.setCurrentPage}
              itemLabel="akaun pengguna"
              accent="blue"
            />
          </>
        )}
      </div>

      {/* Add / Edit User Modal */}
      {showUserModal && (
        <div
          className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          onClick={() => !isSaving && setShowUserModal(false)}
        >
          <div
            className="animate-popover-enter relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="kbelia-important-header sticky top-0 z-10 border-b border-slate-300 dark:border-slate-600 px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-black dark:text-white">
                    {editingUser ? 'Edit Profil Akaun Pengguna' : 'Tambah Akaun Pengguna Baharu'}
                  </h3>
                  <p className="text-[0.875rem] text-black/70 dark:text-white/75">
                    Tetapkan butiran diri, daerah, peranan dan maklumat perniagaan atau agensi.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isSaving && setShowUserModal(false)}
                className="p-2 rounded-xl text-black/70 dark:text-white/75 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-4 sm:p-5 space-y-3.5">
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-sm font-medium text-black dark:text-white flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Nama Penuh *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Masukkan nama penuh"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Alamat Emel *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@contoh.com"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Nombor Telefon</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+601XXXXXXXX"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Daerah</label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white cursor-pointer"
                  >
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Peranan Akaun</label>
                  {editingUser ? (
                    <div className="w-full px-3.5 py-2.5 rounded-xl text-sm font-bold bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white">
                      {ROLE_LABELS[editingUser.role] || 'Usahawan Belia'}
                    </div>
                  ) : (
                    <select
                      value={role === 'mentor' ? 'mentor' : 'user'}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm font-bold bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white cursor-pointer"
                    >
                      <option value="user">Usahawan Belia</option>
                      <option value="mentor">Mentor</option>
                    </select>
                  )}
                </div>

                {(editingUser ? editingUser.role : role) === 'user' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Nama Perniagaan</label>
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="Nama syarikat / kedai"
                        className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Nombor Pendaftaran SSM</label>
                      <input
                        type="text"
                        value={ssmNumber}
                        onChange={(e) => setSsmNumber(e.target.value)}
                        placeholder="Contoh: 202403123456 (KT0123456-X)"
                        className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white"
                      />
                    </div>
                  </>
                )}

                {(editingUser ? editingUser.role : role) === 'mentor' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Institusi / Agensi</label>
                      <input
                        type="text"
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        placeholder="Hab Usahawan / Rakan Industri"
                        className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">ID Rujukan Mentor</label>
                      <input
                        type="text"
                        value={mentorId}
                        onChange={(e) => setMentorId(e.target.value)}
                        placeholder="mentor-1"
                        className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end items-center gap-3 pt-4 border-t border-slate-300 dark:border-slate-600">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setShowUserModal(false)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold text-black dark:text-white bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{isSaving ? 'Menyimpan...' : editingUser ? 'Simpan Perubahan' : 'Daftar Pengguna'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
