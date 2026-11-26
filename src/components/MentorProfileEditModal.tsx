import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Building2, 
  Phone, 
  Mail, 
  Clock, 
  Award, 
  KeyRound, 
  Check, 
  Tag, 
  Trash2, 
  Sparkles,
  Save,
  GraduationCap,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { MentorProfile } from '../types';
import { ImageDropzone } from './ImageDropzone';
import { useConfirmDelete } from '../context/ConfirmDeleteContext';
import { useRoleTheme } from '../hooks/useRoleTheme';
import { getRoleTheme } from '../utils/roleTheme';
import { generateRandomMentorPassword, hashPortalPassword } from '../utils/securityUtils';
import {
  saveLocalAccountCredentialHash,
  saveMentorCredentialHash,
  savePortalUserRecord
} from '../services/dataService';

interface MentorProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentor: MentorProfile | null;
  onSave: (updatedMentor: MentorProfile) => void;
  isAdminEditing?: boolean;
}

export const MentorProfileEditModal: React.FC<MentorProfileEditModalProps> = ({
  isOpen,
  onClose,
  mentor,
  onSave,
  isAdminEditing = false
}) => {
  const isCreating = !mentor;
  const [name, setName] = useState(mentor?.name || '');
  const [title, setTitle] = useState(mentor?.title || '');
  const [agency, setAgency] = useState(mentor?.agency || 'Hab Usahawan KBelia (Mentor Dalaman)');
  const [phone, setPhone] = useState(mentor?.phone || '');
  const [email, setEmail] = useState(mentor?.email || '');
  const [avatarUrl, setAvatarUrl] = useState(mentor?.avatarUrl || '/assets/generated/avatar_mentor_umk_1793924250411.jpg');
  const [availableDays, setAvailableDays] = useState(mentor?.availableDays || '');
  const [bio, setBio] = useState(mentor?.bio || '');
  const [expertise, setExpertise] = useState<string[]>(mentor?.expertise || []);
  const [newExpertiseInput, setNewExpertiseInput] = useState('');
  const [assignedPassword, setAssignedPassword] = useState('');
  const [showAssignedPassword, setShowAssignedPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const { confirmDelete } = useConfirmDelete();
  const { theme } = useRoleTheme();
  const modalTheme = isAdminEditing ? getRoleTheme('admin') : theme;
  const fieldClass = `w-full px-4 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] focus:outline-none transition-all ${modalTheme.inputClass}`;

  useEffect(() => {
    if (isOpen) {
      setName(mentor?.name || '');
      setTitle(mentor?.title || '');
      setAgency(mentor?.agency || 'Hab Usahawan KBelia (Mentor Dalaman)');
      setPhone(mentor?.phone || '');
      setEmail(mentor?.email || '');
      setAvatarUrl(mentor?.avatarUrl || '/assets/generated/avatar_mentor_umk_1793924250411.jpg');
      setAvailableDays(mentor?.availableDays || '');
      setBio(mentor?.bio || '');
      setExpertise(mentor?.expertise || []);
      setAssignedPassword('');
      setShowAssignedPassword(false);
      setFormError(null);
      setSuccessToast(null);
    }
  }, [isOpen, mentor]);

  if (!isOpen) return null;

  const handleAddExpertise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpertiseInput.trim()) return;
    if (!expertise.includes(newExpertiseInput.trim())) {
      setExpertise([...expertise, newExpertiseInput.trim()]);
    }
    setNewExpertiseInput('');
  };

  const handleRemoveExpertise = (tagToRemove: string) => {
    setExpertise(expertise.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const trimmedPass = assignedPassword.trim();
    if (isAdminEditing && isCreating && trimmedPass.length < 6) {
      setFormError('Sila tetapkan kata laluan mentor sekurang-kurangnya 6 aksara.');
      return;
    }
    if (isAdminEditing && !isCreating && trimmedPass.length > 0 && trimmedPass.length < 6) {
      setFormError('Kata laluan baharu mestilah sekurang-kurangnya 6 aksara.');
      return;
    }

    setIsSaving(true);
    const mentorId = mentor?.id || `mentor-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const cleanEmail = email.trim().toLowerCase();
    const nowIso = new Date().toISOString();

    const updatedProfile: MentorProfile = {
      ...(mentor || {}),
      id: mentorId,
      name: name.trim(),
      title: title.trim(),
      agency: agency.trim(),
      phone: phone.trim(),
      email: cleanEmail,
      avatarUrl: avatarUrl.trim() || mentor?.avatarUrl || '/assets/generated/avatar_mentor_umk_1793924250411.jpg',
      availableDays: availableDays.trim(),
      bio: bio.trim(),
      expertise: expertise.length > 0 ? expertise : ['Bimbingan Keusahawanan', 'Pemasaran'],
      activeMenteesCount: mentor?.activeMenteesCount ?? 0,
      updatedAt: nowIso
    };

    try {
      let passwordHash: string | undefined;
      if (isAdminEditing && trimmedPass.length >= 6) {
        passwordHash = await hashPortalPassword(trimmedPass);
        saveMentorCredentialHash(mentorId, cleanEmail, passwordHash);
        saveLocalAccountCredentialHash({
          userId: `user-${mentorId}`,
          fullName: updatedProfile.name,
          email: cleanEmail,
          phone: updatedProfile.phone,
          district: 'Kota Bharu',
          role: 'mentor',
          mentorId,
          passwordHash,
          avatarUrl: updatedProfile.avatarUrl,
          createdAt: nowIso
        });
      }

      if (isAdminEditing) {
        await savePortalUserRecord({
          userId: `user-${mentorId}`,
          fullName: updatedProfile.name,
          email: cleanEmail,
          phone: updatedProfile.phone,
          district: 'Kota Bharu',
          role: 'mentor',
          mentorId,
          institution: updatedProfile.agency,
          designation: updatedProfile.title,
          avatarUrl: updatedProfile.avatarUrl,
          ...(passwordHash ? { passwordHash, passwordUpdatedAt: nowIso } : {})
        }).catch(() => {});
      }

      onSave(updatedProfile);
      setIsSaving(false);
      setSuccessToast(isCreating ? 'Mentor baharu berjaya didaftarkan!' : 'Profil mentor berjaya dikemas kini!');
      setTimeout(() => {
        onClose();
      }, 500);
    } catch {
      setIsSaving(false);
      setFormError('Gagal menyimpan maklumat mentor. Sila cuba lagi.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className={`relative w-full max-w-2xl rounded-2xl shadow-xl border overflow-hidden flex flex-col max-h-[92vh] transition-colors my-6 backdrop-blur-md ${modalTheme.surfaceClass}`}>
        
        {/* Header */}
        <div className={`border-b py-4 px-6 sm:px-7 flex items-center justify-between shrink-0 ${modalTheme.surfaceMutedClass} ${modalTheme.dividerClass}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${modalTheme.surfaceClass} ${modalTheme.dividerClass} ${modalTheme.accentTextClass}`}>
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-black dark:text-white tracking-tight">
                {isCreating ? 'Tambah Mentor Baharu' : isAdminEditing ? 'Edit Profil Mentor' : 'Edit Profil Saya'}
              </h3>
              <p className="text-sm text-black/65 dark:text-white/70">
                Maklumat bimbingan dan perhubungan rasmi mentor
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className={modalTheme.iconButtonClass}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 overflow-y-auto space-y-5">
          
          {formError && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-black dark:text-white text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <span>{formError}</span>
            </div>
          )}

          {successToast && (
            <div className={`p-3.5 border rounded-xl text-black dark:text-white text-sm sm:text-[0.9375rem] flex items-center gap-2 ${modalTheme.surfaceMutedClass} ${modalTheme.dividerClass}`}>
              <Check className={`w-4 h-4 shrink-0 ${modalTheme.accentTextClass}`} />
              <span className="font-semibold">{successToast}</span>
            </div>
          )}

          {/* Gambar Profil Mentor */}
          <div>
            <ImageDropzone
              value={avatarUrl}
              onChange={(val) => setAvatarUrl(val)}
              label="Gambar Profil"
              aspectRatio="1:1"
            />
          </div>

          {/* 2-Column Row 1: Nama Penuh + Jawatan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-1.5">
                Nama Penuh <span className={modalTheme.accentTextClass}>*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama penuh"
                className={`${fieldClass} font-medium`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-1.5">
                Jawatan <span className={modalTheme.accentTextClass}>*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Masukkan jawatan"
                className={`${fieldClass} font-medium`}
              />
            </div>
          </div>

          {/* 2-Column Row 2: Agensi + Telefon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-1.5">
                Agensi <span className={modalTheme.accentTextClass}>*</span>
              </label>
              <input
                type="text"
                required
                value={agency}
                onChange={(e) => setAgency(e.target.value)}
                placeholder="Masukkan agensi"
                className={`${fieldClass} font-medium`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-1.5">
                Nombor Telefon <span className={modalTheme.accentTextClass}>*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Masukkan nombor telefon"
                className={`${fieldClass} font-mono`}
              />
            </div>
          </div>

          {/* Row 3: Kredensial Log Masuk Mentor (Emel + Kata Laluan) */}
          <div className={`p-4 rounded-xl border space-y-3.5 ${modalTheme.surfaceMutedClass} ${modalTheme.dividerClass}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <KeyRound className={`w-4 h-4 shrink-0 ${modalTheme.accentTextClass}`} />
                <span className="text-sm font-semibold text-black dark:text-white">
                  Kredensial Log Masuk Mentor
                </span>
              </div>
              {isAdminEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setAssignedPassword(generateRandomMentorPassword());
                    setShowAssignedPassword(true);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${modalTheme.secondaryButtonClass}`}
                >
                  Jana Kata Laluan
                </button>
              )}
            </div>

            <div className={`grid grid-cols-1 ${isAdminEditing ? 'sm:grid-cols-2' : ''} gap-3.5`}>
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-1.5">
                  Alamat Emel Rasmi <span className={modalTheme.accentTextClass}>*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mentor@kbelia.my"
                  className={fieldClass}
                />
              </div>

              {isAdminEditing && (
                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-1.5">
                    Kata Laluan Mentor {isCreating ? <span className={modalTheme.accentTextClass}>*</span> : <span className="text-xs text-black/60 dark:text-white/60">(Pilihan)</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={showAssignedPassword ? 'text' : 'password'}
                      required={isCreating}
                      value={assignedPassword}
                      onChange={(e) => setAssignedPassword(e.target.value)}
                      placeholder={isCreating ? 'Minimum 6 aksara' : 'Biarkan kosong jika kekal'}
                      className={`${fieldClass} pr-10 font-mono`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowAssignedPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-black/65 dark:text-white/70 hover:text-black dark:hover:text-white cursor-pointer"
                      aria-label={showAssignedPassword ? 'Sembunyi kata laluan' : 'Papar kata laluan'}
                    >
                      {showAssignedPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
            {isAdminEditing && (
              <p className="text-xs text-black/65 dark:text-white/65 leading-relaxed">
                Mentor akan log masuk ke Portal Mentor menggunakan emel rasmi dan kata laluan yang ditetapkan di sini.
              </p>
            )}
          </div>

          {/* Section: Bidang Pengkhususan */}
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-1.5">
              Bidang Kepakaran
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {expertise.map((tag, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 border rounded-lg text-sm font-medium text-black dark:text-white ${modalTheme.surfaceMutedClass} ${modalTheme.dividerClass}`}
                >
                  <Award className={`w-3.5 h-3.5 shrink-0 ${modalTheme.accentTextClass}`} />
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() =>
                      confirmDelete({
                        itemName: tag,
                        itemType: 'Bidang Pengkhususan Mentor',
                        onConfirm: () => handleRemoveExpertise(tag)
                      })
                    }
                    className="hover:text-black cursor-pointer ml-1 text-black/65 dark:text-white/70 dark:hover:text-white"
                    title="Padam tag"
                    aria-label={`Padam ${tag}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newExpertiseInput}
                onChange={(e) => setNewExpertiseInput(e.target.value)}
                placeholder="Masukkan bidang kepakaran"
                className={`flex-1 px-4 py-2.5 text-sm sm:text-[0.9375rem] rounded-xl focus:outline-none transition-all ${modalTheme.inputClass}`}
              />
              <button
                type="button"
                onClick={handleAddExpertise}
                className={`py-2.5 px-4 text-sm inline-flex items-center gap-1.5 ${modalTheme.secondaryButtonClass}`}
              >
                <Tag className={`w-4 h-4 ${modalTheme.accentTextClass}`} />
                <span>Tambah</span>
              </button>
            </div>
          </div>

          {/* Section: Bio / Latar Belakang */}
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-1.5">
              Ringkasan Profil
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Masukkan ringkasan profil"
              className={fieldClass}
            />
          </div>

          {/* Action Buttons Footer */}
          <div className={`flex justify-end items-center gap-3 pt-5 border-t ${modalTheme.dividerClass}`}>
            <button
              type="button"
              onClick={onClose}
              className={`py-2.5 px-5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${modalTheme.secondaryButtonClass}`}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`py-2.5 px-6 rounded-xl text-sm font-semibold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 ${modalTheme.primaryButtonClass}`}
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
