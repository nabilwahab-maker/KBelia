import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit3,
  Trash2,
  ShieldCheck,
  GraduationCap,
  Store,
  X,
  Save,
  Loader2,
  AlertCircle
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
  mentor: 'Mentor Bertauliah',
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
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return portalUsers.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (!q) return true;
      return (
        (u.fullName || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.businessName || '').toLowerCase().includes(q) ||
        (u.district || '').toLowerCase().includes(q)
      );
    });
  }, [portalUsers, roleFilter, searchQuery]);

  const pagination = usePagination(filteredUsers, 6, [roleFilter, searchQuery, filteredUsers.length]);

  const counts = useMemo(
    () => ({
      all: portalUsers.length,
      user: portalUsers.filter((u) => u.role === 'user').length,
      mentor: portalUsers.filter((u) => u.role === 'mentor').length,
      admin: portalUsers.filter((u) => u.role === 'admin').length
    }),
    [portalUsers]
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

    if (editingUser && isCurrentActiveUser(editingUser) && role !== 'admin') {
      setFormError('Anda tidak boleh menurunkan peranan akaun pentadbir yang sedang log masuk.');
      return;
    }

    setIsSaving(true);
    try {
      await savePortalUserRecord({
        ...(editingUser || {}),
        userId: editingUser?.userId,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        district,
        role,
        businessName: businessName.trim(),
        ssmNumber: ssmNumber.trim(),
        institution: institution.trim(),
        designation: designation.trim(),
        mentorId: role === 'mentor' ? mentorId.trim() || editingUser?.mentorId || 'mentor-1' : undefined
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

  const handleDirectRoleChange = async (target: UserProfile, nextRole: UserRole) => {
    if (isCurrentActiveUser(target) && nextRole !== 'admin') {
      showToast('Akaun pentadbir yang sedang aktif tidak boleh ditukar peranan.', 'warning');
      return;
    }
    try {
      await savePortalUserRecord({
        ...target,
        role: nextRole,
        mentorId: nextRole === 'mentor' ? target.mentorId || 'mentor-1' : target.mentorId
      });
      showToast(`Peranan ${target.fullName} ditukar kepada ${ROLE_LABELS[nextRole]}.`, 'success');
      onRefresh?.();
    } catch {
      showToast('Gagal menukar peranan pengguna.', 'error');
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
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="kbelia-important-header p-5 sm:p-6 rounded-2xl border border-slate-300 dark:border-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-black dark:text-white border border-indigo-200 dark:border-indigo-800/70 text-[0.8125rem] font-bold uppercase tracking-wider">
            <Users className="w-3.5 h-3.5" />
            <span>Kawalan Penuh Pentadbir</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-black dark:text-white">
            Pengurusan Akaun &amp; Profil Pengguna Portal
          </h3>
          <p className="text-[0.9375rem] text-black/75 dark:text-white/80 max-w-2xl">
            Tambah akaun baharu, kemas kini maklumat profil, tukar tahap peranan (Belia / Mentor / Admin) atau padam akaun.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold inline-flex items-center gap-2 shadow-xs cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pengguna Baharu</span>
        </button>
      </div>

      {/* Role Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-300 dark:border-slate-600 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {([
            { id: 'all', label: `Semua (${counts.all})` },
            { id: 'user', label: `Usahawan Belia (${counts.user})` },
            { id: 'mentor', label: `Mentor (${counts.mentor})` },
            { id: 'admin', label: `Pentadbir (${counts.admin})` }
          ] as const).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setRoleFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                roleFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-50 dark:bg-slate-900 text-black dark:text-white border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-black/70 dark:text-white/75 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nama, emel atau perniagaan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/55 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-black dark:text-white">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-300 dark:border-slate-600 text-[0.8125rem] uppercase tracking-wider text-black/75 dark:text-white/80 font-bold">
              <tr>
                <th className="p-4">Profil Pengguna</th>
                <th className="p-4">Maklumat Hubungan</th>
                <th className="p-4">Organisasi / Perniagaan</th>
                <th className="p-4">Peranan Akaun</th>
                <th className="p-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {pagination.paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-black/70 dark:text-white/75">
                    Tiada rekod akaun pengguna sepadan dengan tapisan semasa.
                  </td>
                </tr>
              ) : (
                pagination.paginatedItems.map((u) => {
                  const isSelf = isCurrentActiveUser(u);
                  return (
                    <tr key={u.userId} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatarUrl || '/assets/generated/avatar_youth_male_1793924250192.jpg'}
                            alt={u.fullName}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-300 dark:border-slate-600 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-black dark:text-white flex items-center gap-1.5">
                              <span className="truncate">{u.fullName}</span>
                              {isSelf && (
                                <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-[0.75rem] font-bold">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="text-[0.8125rem] font-mono text-black/65 dark:text-white/65 truncate">
                              ID: {u.userId}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="font-mono text-sm text-black dark:text-white">{u.email}</div>
                        <div className="text-sm text-black/70 dark:text-white/75 tabular-nums">
                          {u.phone || 'Tiada telefon'} · {u.district || 'Kota Bharu'}
                        </div>
                      </td>

                      <td className="p-4">
                        {u.role === 'user' ? (
                          <div>
                            <div className="font-semibold text-black dark:text-white flex items-center gap-1.5">
                              <Store className="w-3.5 h-3.5 shrink-0 opacity-70" />
                              <span>{u.businessName || 'Belum daftar perniagaan'}</span>
                            </div>
                            {u.ssmNumber && (
                              <div className="text-[0.8125rem] font-mono text-black/70 dark:text-white/75">{u.ssmNumber}</div>
                            )}
                          </div>
                        ) : u.role === 'mentor' ? (
                          <div className="font-semibold text-black dark:text-white flex items-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5 shrink-0 opacity-70" />
                            <span>{u.institution || 'UMK / Agensi Bimbingan'}</span>
                          </div>
                        ) : (
                          <div className="font-semibold text-black dark:text-white flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 shrink-0 opacity-70" />
                            <span>{u.designation || 'Pentadbir Portal KBelia'}</span>
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        <select
                          aria-label={`Tukar peranan ${u.fullName}`}
                          value={u.role}
                          disabled={isSelf}
                          onChange={(e) => handleDirectRoleChange(u, e.target.value as UserRole)}
                          className="px-2.5 py-1.5 rounded-lg text-[0.8125rem] font-bold bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <option value="user">Usahawan Belia</option>
                          <option value="mentor">Mentor Bertauliah</option>
                          <option value="admin">Pentadbir Sistem</option>
                        </select>
                      </td>

                      <td className="p-4 text-right">
                        <div className="inline-flex items-center justify-end gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800/70 text-black dark:text-white text-[0.8125rem] font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() =>
                              confirmDelete({
                                itemName: `${u.fullName} (${u.email})`,
                                itemType: 'Akaun Pengguna',
                                description: 'Akaun yang dipadam akan dikeluarkan daripada senarai pengguna aktif portal.',
                                onConfirm: () => handleDeleteUser(u)
                              })
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/70 text-black dark:text-white text-[0.8125rem] font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            title={isSelf ? 'Akaun aktif sendiri tidak boleh dipadam' : `Padam ${u.fullName}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Padam</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-3">
          <PaginationBar
            currentPage={pagination.currentPage}
            totalItems={pagination.totalItems}
            itemsPerPage={6}
            onPageChange={pagination.setCurrentPage}
            itemLabel="akaun pengguna"
            accent="rose"
          />
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {showUserModal && (
        <div
          className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          onClick={() => !isSaving && setShowUserModal(false)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="kbelia-important-header sticky top-0 z-10 border-b border-slate-300 dark:border-slate-600 px-6 py-4 flex items-center justify-between">
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

            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
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
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm font-bold bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white cursor-pointer"
                  >
                    <option value="user">Usahawan Belia</option>
                    <option value="mentor">Mentor Bertauliah</option>
                    <option value="admin">Pentadbir Sistem</option>
                  </select>
                </div>

                {role === 'user' && (
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
                      <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">No. Pendaftaran SSM</label>
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

                {role === 'mentor' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Institusi / Agensi</label>
                      <input
                        type="text"
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        placeholder="UMK / INSKEN / SME Corp"
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

                {role === 'admin' && (
                  <div>
                    <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Jawatan Pentadbiran</label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="Pegawai Penyelaras Negeri"
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white"
                    />
                  </div>
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
