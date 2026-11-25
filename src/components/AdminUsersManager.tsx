import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  Plus,
  X,
  Save,
  Loader2,
  AlertCircle,
  Edit3,
  Trash2
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
import { DEFAULT_SORT_VALUE, buildStandardSortOptions, compareText, sortRecords } from '../utils/sortUtils';
import { getRoleTheme } from '../utils/roleTheme';
import {
  GoogleWorkspaceSplitPane,
  SidePreviewEmptyState,
  SidePreviewHeader,
  SidePreviewMetricsStrip,
  WorkspaceHeaderCard,
  getWorkspaceActiveRowClass
} from './GoogleWorkspaceSplitPane';

const adminTheme = getRoleTheme('admin');

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
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

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

    return sortRecords(filtered, {
      sortBy,
      getName: (u) => u.fullName || u.email || '',
      customCompare: (a, b, mode) => {
        if (mode === 'role_asc') return compareText(ROLE_LABELS[a.role], ROLE_LABELS[b.role]);
        if (mode === 'district_asc') return compareText(a.district || 'Kota Bharu', b.district || 'Kota Bharu');
        return null;
      }
    });
  }, [nonAdminUsers, roleFilter, districtFilter, searchQuery, sortBy]);

  const pagination = usePagination(filteredUsers, 7, [
    roleFilter,
    districtFilter,
    searchQuery,
    sortBy,
    filteredUsers.length
  ]);

  const selectedUser = useMemo(
    () =>
      filteredUsers.find((u) => u.userId === selectedUserId) ||
      pagination.paginatedItems[0] ||
      filteredUsers[0] ||
      null,
    [filteredUsers, selectedUserId, pagination.paginatedItems]
  );

  const activeFilterCount =
    (roleFilter !== 'all' ? 1 : 0) +
    (districtFilter !== 'Semua' ? 1 : 0) +
    (sortBy !== DEFAULT_SORT_VALUE ? 1 : 0);

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

  const hasActiveFilters = Boolean(searchQuery.trim() || activeFilterCount > 0);

  const getUserOrgLabel = (u: UserProfile) =>
    u.role === 'user'
      ? u.businessName || 'Belum daftar perniagaan'
      : u.role === 'mentor'
      ? u.institution || 'Hab Usahawan / Rakan Industri'
      : u.designation || 'Pentadbir Portal KBelia';

  return (
    <div className="space-y-4 animate-dashboard-tab">
      <WorkspaceHeaderCard
        role="admin"
        icon={<Users className="w-5 h-5" />}
        title="Pengurusan Akaun & Profil Pengguna Portal"
        subtitle="Semak profil usahawan belia, maklumat SSM, serta mentor bertauliah."
        rightActions={
          <button
            type="button"
            onClick={openCreateModal}
            className={`px-3.5 py-2 rounded-xl text-sm font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap shrink-0 transition-colors ${adminTheme.primaryButtonClass}`}
          >
            <Plus className="w-4 h-4" />
            <span>Tambah</span>
          </button>
        }
        tabs={[
          { id: 'all', label: 'Semua', count: counts.all },
          { id: 'user', label: 'Usahawan Belia', count: counts.user },
          { id: 'mentor', label: 'Mentor', count: counts.mentor }
        ]}
        activeTab={roleFilter}
        onTabChange={(id) => {
          setRoleFilter(id as 'all' | UserRole);
          setMobilePreviewOpen(false);
        }}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari nama, emel atau perniagaan..."
        extraControls={
          <>
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              aria-label="Tapis daerah pengguna"
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium cursor-pointer focus:outline-none ${adminTheme.inputClass}`}
            >
              <option value="Semua">Semua Daerah</option>
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Susun pengguna"
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium cursor-pointer focus:outline-none ${adminTheme.inputClass}`}
            >
              {userSortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </>
        }
      />

      {pagination.paginatedItems.length === 0 ? (
        <div className={`rounded-2xl border backdrop-blur-xs p-10 text-center space-y-2 ${adminTheme.surfaceClass}`}>
          <Users className="w-9 h-9 text-black/30 dark:text-white/30 mx-auto" />
          <p className="text-sm font-bold text-black dark:text-white kbelia-trim">
            Tiada rekod akaun pengguna sepadan dengan tapisan semasa.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setRoleFilter('all');
                setDistrictFilter('Semua');
                setSortBy(DEFAULT_SORT_VALUE);
              }}
              className={`text-sm font-bold hover:underline cursor-pointer ${adminTheme.accentTextClass}`}
            >
              Set Semula Carian &amp; Penapis
            </button>
          )}
        </div>
      ) : (
        <GoogleWorkspaceSplitPane
          role="admin"
          mobileOpen={mobilePreviewOpen && Boolean(selectedUser)}
          onMobileClose={() => setMobilePreviewOpen(false)}
          mobileTitle={selectedUser?.fullName}
          leftHeader={
            <div className={`px-4 py-2.5 border-b flex items-center justify-between text-xs font-semibold text-black/65 dark:text-white/70 ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
              <span>{filteredUsers.length} pengguna dipaparkan</span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setRoleFilter('all');
                    setDistrictFilter('Semua');
                    setSortBy(DEFAULT_SORT_VALUE);
                  }}
                  className={`font-bold hover:underline cursor-pointer ${adminTheme.accentTextClass}`}
                >
                  Set Semula
                </button>
              )}
            </div>
          }
          leftContent={pagination.paginatedItems.map((u) => {
            const isSelected = selectedUser?.userId === u.userId;
            const isSelf = isCurrentActiveUser(u);
            return (
              <div
                key={u.userId}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelectedUserId(u.userId);
                  setMobilePreviewOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedUserId(u.userId);
                    setMobilePreviewOpen(true);
                  }
                }}
                className={`px-4 py-3.5 cursor-pointer transition-colors flex items-start gap-3 ${
                  isSelected ? getWorkspaceActiveRowClass('admin') : adminTheme.rowHoverClass
                }`}
              >
                <img
                  src={u.avatarUrl || '/assets/generated/avatar_youth_male_1793924250192.jpg'}
                  alt={u.fullName}
                  className={`w-11 h-11 rounded-xl object-cover border shrink-0 ${adminTheme.dividerClass}`}
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-black dark:text-white leading-snug truncate kbelia-trim">
                      {u.fullName}
                      {isSelf ? ' (Anda)' : ''}
                    </p>
                    <span
                      className={`text-[11px] font-bold shrink-0 px-2 py-0.5 rounded-lg ${
                        u.role === 'mentor'
                          ? 'bg-[#0E7490]/12 text-[#0E7490] dark:text-[#22D3EE]'
                          : 'bg-[#0B6E52]/12 text-[#0B6E52] dark:text-[#34D399]'
                      }`}
                    >
                      {ROLE_LABELS[u.role] || 'Usahawan Belia'}
                    </span>
                  </div>
                  <p className="text-xs text-black/65 dark:text-white/65 truncate">
                    {u.email} · {u.district || 'Kota Bharu'}
                  </p>
                </div>
              </div>
            );
          })}
          leftFooter={
            <PaginationBar
              currentPage={pagination.currentPage}
              totalItems={pagination.totalItems}
              itemsPerPage={7}
              onPageChange={pagination.setCurrentPage}
              itemLabel="akaun pengguna"
              accent="amber"
            />
          }
          rightContent={
            selectedUser ? (
              <div>
                <SidePreviewHeader
                  role="admin"
                  media={
                    <img
                      src={selectedUser.avatarUrl || '/assets/generated/avatar_youth_male_1793924250192.jpg'}
                      alt={selectedUser.fullName}
                      className={`w-14 h-14 rounded-xl object-cover border ${adminTheme.dividerClass}`}
                    />
                  }
                  title={`${selectedUser.fullName}${isCurrentActiveUser(selectedUser) ? ' (Anda)' : ''}`}
                  status={
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                        selectedUser.role === 'mentor'
                          ? 'bg-[#0E7490]/15 text-[#0E7490] dark:text-[#22D3EE]'
                          : 'bg-[#0B6E52]/15 text-[#0B6E52] dark:text-[#34D399]'
                      }`}
                    >
                      {ROLE_LABELS[selectedUser.role] || 'Usahawan Belia'}
                    </span>
                  }
                  subtitle={getUserOrgLabel(selectedUser)}
                  meta={<span>{selectedUser.email}</span>}
                  actions={
                    <>
                      <button
                        type="button"
                        onClick={() => openEditModal(selectedUser)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${adminTheme.primaryButtonClass}`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Profil</span>
                      </button>
                      <button
                        type="button"
                        disabled={isCurrentActiveUser(selectedUser)}
                        onClick={() =>
                          confirmDelete({
                            itemName: `${selectedUser.fullName} (${selectedUser.email})`,
                            itemType: 'Akaun Pengguna',
                            description: 'Akaun yang dipadam akan dikeluarkan daripada senarai pengguna aktif portal.',
                            onConfirm: () => handleDeleteUser(selectedUser)
                          })
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${adminTheme.dangerOutlineButtonClass}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Padam Akaun</span>
                      </button>
                    </>
                  }
                />

                <div className="p-4 sm:p-5 space-y-4">
                  <SidePreviewMetricsStrip
                    role="admin"
                    columns={3}
                    items={[
                      { label: 'Peranan Akaun', value: ROLE_LABELS[selectedUser.role] || 'Usahawan Belia' },
                      { label: 'Daerah', value: selectedUser.district || 'Kota Bharu' },
                      { label: 'Nombor Telefon', value: selectedUser.phone || '-', mono: true }
                    ]}
                  />

                  <div className={`p-4 rounded-xl border space-y-2.5 ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-stone-400 block">
                      {selectedUser.role === 'mentor' ? 'Maklumat Mentor & Agensi' : 'Maklumat Perniagaan & SSM'}
                    </span>
                    {selectedUser.role === 'mentor' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-xs text-slate-500 dark:text-stone-400 block">Institusi / Agensi</span>
                          <span className="font-semibold text-black dark:text-white kbelia-trim">
                            {selectedUser.institution || 'Hab Usahawan / Rakan Industri'}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 dark:text-stone-400 block">ID Rujukan Mentor</span>
                          <span className="font-mono font-semibold text-black dark:text-white">
                            {selectedUser.mentorId || '-'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-xs text-slate-500 dark:text-stone-400 block">Nama Perniagaan</span>
                          <span className="font-semibold text-black dark:text-white kbelia-trim">
                            {selectedUser.businessName || 'Belum didaftarkan'}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 dark:text-stone-400 block">Nombor Pendaftaran SSM</span>
                          <span className="font-mono font-semibold text-black dark:text-white">
                            {selectedUser.ssmNumber || '-'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <SidePreviewEmptyState
                icon={<Users className="w-10 h-10" />}
                title="Pilih akaun pengguna"
                description="Klik mana-mana pengguna di sebelah kiri untuk melihat profil penuh dan pilihan suntingan."
              />
            )
          }
        />
      )}

      {/* Add / Edit User Modal */}
      {showUserModal && (
        <div
          className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          onClick={() => !isSaving && setShowUserModal(false)}
        >
          <div
            className={`animate-popover-enter relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border shadow-2xl ${adminTheme.surfaceClass}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`sticky top-0 z-10 border-b px-5 py-3.5 flex items-center justify-between ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${adminTheme.activeMiniBtnClass}`}>
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
                className="p-2 rounded-xl text-black/70 dark:text-white/75 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
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
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none ${adminTheme.inputClass}`}
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
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none ${adminTheme.inputClass}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Nombor Telefon</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+601XXXXXXXX"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-mono focus:outline-none ${adminTheme.inputClass}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Daerah</label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm cursor-pointer focus:outline-none ${adminTheme.inputClass}`}
                  >
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Peranan Akaun</label>
                  {editingUser ? (
                    <div className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-bold border text-black dark:text-white ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
                      {ROLE_LABELS[editingUser.role] || 'Usahawan Belia'}
                    </div>
                  ) : (
                    <select
                      value={role === 'mentor' ? 'mentor' : 'user'}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-bold cursor-pointer focus:outline-none ${adminTheme.inputClass}`}
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
                        className={`w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none ${adminTheme.inputClass}`}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Nombor Pendaftaran SSM</label>
                      <input
                        type="text"
                        value={ssmNumber}
                        onChange={(e) => setSsmNumber(e.target.value)}
                        placeholder="Contoh: 202403123456 (KT0123456-X)"
                        className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-mono focus:outline-none ${adminTheme.inputClass}`}
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
                        className={`w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none ${adminTheme.inputClass}`}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">ID Rujukan Mentor</label>
                      <input
                        type="text"
                        value={mentorId}
                        onChange={(e) => setMentorId(e.target.value)}
                        placeholder="mentor-1"
                        className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-mono focus:outline-none ${adminTheme.inputClass}`}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className={`flex flex-col-reverse sm:flex-row justify-end items-center gap-3 pt-4 border-t ${adminTheme.dividerClass}`}>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setShowUserModal(false)}
                  className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer ${adminTheme.secondaryButtonClass}`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 ${adminTheme.primaryButtonClass}`}
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
