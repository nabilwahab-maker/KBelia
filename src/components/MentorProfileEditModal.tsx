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
  ShieldCheck
} from 'lucide-react';
import { MentorProfile } from '../types';
import { ImageDropzone } from './ImageDropzone';
import { useConfirmDelete } from '../context/ConfirmDeleteContext';

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
  const [availableDays, setAvailableDays] = useState(mentor?.availableDays || 'Ahad & Selasa (9:00 PG - 1:00 PTG)');
  const [bio, setBio] = useState(mentor?.bio || '');
  const [expertise, setExpertise] = useState<string[]>(mentor?.expertise || []);
  const [newExpertiseInput, setNewExpertiseInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const { confirmDelete } = useConfirmDelete();

  useEffect(() => {
    if (isOpen) {
      setName(mentor?.name || '');
      setTitle(mentor?.title || '');
      setAgency(mentor?.agency || 'Hab Usahawan KBelia (Mentor Dalaman)');
      setPhone(mentor?.phone || '');
      setEmail(mentor?.email || '');
      setAvatarUrl(mentor?.avatarUrl || '/assets/generated/avatar_mentor_umk_1793924250411.jpg');
      setAvailableDays(mentor?.availableDays || 'Ahad & Selasa (9:00 PG - 1:00 PTG)');
      setBio(mentor?.bio || '');
      setExpertise(mentor?.expertise || []);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const updatedProfile: MentorProfile = {
      ...(mentor || {}),
      id: mentor?.id || `mentor-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: name.trim(),
      title: title.trim(),
      agency: agency.trim(),
      phone: phone.trim(),
      email: email.trim(),
      avatarUrl: avatarUrl.trim() || mentor?.avatarUrl || '/assets/generated/avatar_mentor_umk_1793924250411.jpg',
      availableDays: availableDays.trim(),
      bio: bio.trim(),
      expertise: expertise.length > 0 ? expertise : ['Bimbingan Keusahawanan', 'Pemasaran'],
      activeMenteesCount: mentor?.activeMenteesCount ?? 0,
      updatedAt: new Date().toISOString()
    };

    setTimeout(() => {
      onSave(updatedProfile);
      setIsSaving(false);
      setSuccessToast(isCreating ? 'Mentor baharu berjaya didaftarkan!' : 'Profil mentor berjaya dikemas kini!');
      setTimeout(() => {
        onClose();
      }, 600);
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-300 dark:border-slate-600 overflow-hidden flex flex-col max-h-[92vh] transition-colors my-6">
        
        {/* Header */}
        <div className="kbelia-important-header border-b border-slate-300 dark:border-slate-600 py-4.5 px-6 sm:px-7 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/70 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-black dark:text-white tracking-tight">
                {isCreating ? 'Tambah Mentor Baharu' : isAdminEditing ? 'Edit Profil Mentor' : 'Edit Profil Saya (Mentor)'}
              </h3>
              <p className="text-[0.9375rem] text-black/70 dark:text-white/75">
                Info bimbingan, waktu temu janji dan maklumat perhubungan rasmi KBelia
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 overflow-y-auto space-y-5">
          
          {successToast && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-black dark:text-white text-sm sm:text-[0.9375rem] flex items-center gap-2">
              <Check className="w-4 h-4 text-black dark:text-white shrink-0" />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm sm:text-[0.9375rem] font-medium text-black dark:text-white mb-2">
                Nama Penuh <span className="text-black dark:text-white">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama penuh"
                className="w-full px-4.5 py-3 rounded-lg text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 transition-all dark:focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm sm:text-[0.9375rem] font-medium text-black dark:text-white mb-2">
                Jawatan <span className="text-black dark:text-white">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Masukkan jawatan"
                className="w-full px-4.5 py-3 rounded-lg text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 transition-all dark:focus:border-blue-500"
              />
            </div>
          </div>

          {/* 2-Column Row 2: Agensi + Telefon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm sm:text-[0.9375rem] font-medium text-black dark:text-white mb-2">
                Agensi <span className="text-black dark:text-white">*</span>
              </label>
              <input
                type="text"
                required
                value={agency}
                onChange={(e) => setAgency(e.target.value)}
                placeholder="Masukkan agensi"
                className="w-full px-4.5 py-3 rounded-lg text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 transition-all dark:focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm sm:text-[0.9375rem] font-medium text-black dark:text-white mb-2">
                Nombor Telefon <span className="text-black dark:text-white">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Masukkan nombor telefon"
                className="w-full px-4.5 py-3 rounded-lg text-sm sm:text-[0.9375rem] font-mono bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 transition-all dark:focus:border-blue-500"
              />
            </div>
          </div>

          {/* Row 3: Emel Rasmi */}
          <div>
            <label className="block text-sm sm:text-[0.9375rem] font-medium text-black dark:text-white mb-2">
              Alamat Emel <span className="text-black dark:text-white">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukkan alamat emel"
              className="w-full px-4.5 py-3 rounded-lg text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 transition-all dark:focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm sm:text-[0.9375rem] font-medium text-black dark:text-white mb-2">
              Jadual Bimbingan <span className="text-black dark:text-white">*</span>
            </label>
            <input
              type="text"
              required
              value={availableDays}
              onChange={(e) => setAvailableDays(e.target.value)}
              placeholder="Masukkan jadual bimbingan"
              className="w-full px-4.5 py-3 rounded-lg text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 transition-all dark:focus:border-blue-500"
            />
          </div>

          {/* Section: Bidang Pengkhususan */}
          <div>
            <label className="block text-sm sm:text-[0.9375rem] font-medium text-black dark:text-white mb-2">
              Bidang Kepakaran
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {expertise.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/60 text-black dark:text-white border border-amber-200 dark:border-amber-800/70 rounded-lg text-sm font-medium"
                >
                  <Award className="w-3.5 h-3.5 text-black dark:text-white/75 shrink-0" />
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
                    className="hover:text-black cursor-pointer ml-1 text-black/70 dark:text-white/75 dark:hover:text-white"
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
                className="flex-1 px-4.5 py-2.5 text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-black dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 transition-all dark:focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddExpertise}
                className="py-2.5 px-5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm sm:text-[0.9375rem] font-semibold flex items-center gap-1.5 cursor-pointer transition-all shrink-0 dark:bg-teal-600"
              >
                <Tag className="w-4 h-4" />
                <span>Tambah Bidang</span>
              </button>
            </div>
          </div>

          {/* Section: Bio / Latar Belakang */}
          <div>
            <label className="block text-sm sm:text-[0.9375rem] font-medium text-black dark:text-white mb-2">
              Ringkasan Profil
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Masukkan ringkasan profil"
              className="w-full px-4.5 py-3 rounded-lg text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/55 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 transition-all dark:focus:border-blue-500"
            />
          </div>

          {/* Action Buttons Footer */}
          <div className="flex justify-end items-center gap-3 pt-5 border-t border-slate-300 dark:border-slate-600">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-5 rounded-lg text-sm sm:text-[0.9375rem] font-semibold text-black dark:text-white border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="py-2.5 px-6 rounded-lg text-sm sm:text-[0.9375rem] font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 dark:bg-blue-600"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
