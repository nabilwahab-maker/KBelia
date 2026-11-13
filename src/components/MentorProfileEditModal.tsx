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
  mentor: MentorProfile;
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
  const [name, setName] = useState(mentor.name);
  const [title, setTitle] = useState(mentor.title);
  const [agency, setAgency] = useState(mentor.agency);
  const [phone, setPhone] = useState(mentor.phone);
  const [email, setEmail] = useState(mentor.email);
  const [avatarUrl, setAvatarUrl] = useState(mentor.avatarUrl || '');
  const [availableDays, setAvailableDays] = useState(mentor.availableDays);
  const [bio, setBio] = useState(mentor.bio);
  const [expertise, setExpertise] = useState<string[]>(mentor.expertise || []);
  const [newExpertiseInput, setNewExpertiseInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const { confirmDelete } = useConfirmDelete();

  useEffect(() => {
    if (isOpen) {
      setName(mentor.name);
      setTitle(mentor.title);
      setAgency(mentor.agency);
      setPhone(mentor.phone);
      setEmail(mentor.email);
      setAvatarUrl(mentor.avatarUrl || '');
      setAvailableDays(mentor.availableDays);
      setBio(mentor.bio);
      setExpertise(mentor.expertise || []);
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
      ...mentor,
      name: name.trim(),
      title: title.trim(),
      agency: agency.trim(),
      phone: phone.trim(),
      email: email.trim(),
      avatarUrl: avatarUrl.trim() || mentor.avatarUrl,
      availableDays: availableDays.trim(),
      bio: bio.trim(),
      expertise: expertise.length > 0 ? expertise : ['Bimbingan Keusahawanan', 'Pemasaran']
    };

    setTimeout(() => {
      onSave(updatedProfile);
      setIsSaving(false);
      setSuccessToast('Profil mentor berjaya dikemas kini!');
      setTimeout(() => {
        onClose();
      }, 700);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[92vh] transition-colors my-6">
        
        {/* Header */}
        <div className="kbelia-important-header border-b border-slate-200 dark:border-slate-700 py-4.5 px-6 sm:px-7 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/70 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-black dark:text-white tracking-tight">
                {isAdminEditing ? 'Urus & Kemas Kini Profil Mentor' : 'Sunting Profil Saya (Mentor)'}
              </h3>
              <p className="text-xs text-black/70 dark:text-white/75">
                Maklumat bimbingan, waktu temu janji dan saluran perhubungan rasmi Universiti Malaysia Kelantan (UMK)
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
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-black dark:text-white text-xs sm:text-sm flex items-center gap-2">
              <Check className="w-4 h-4 text-black dark:text-white shrink-0" />
              <span className="font-semibold">{successToast}</span>
            </div>
          )}

          {/* Gambar Profil Mentor */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-black dark:text-white mb-2">
              Gambar Profil Mentor:
            </label>
            <ImageDropzone
              value={avatarUrl}
              onChange={(val) => setAvatarUrl(val)}
              label="Tarik gambar profil atau klik untuk pilih fail"
              aspectRatio="1:1"
            />
          </div>

          {/* 2-Column Row 1: Nama Penuh + Jawatan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-black dark:text-white mb-2">
                Nama Penuh & Gelaran: <span className="text-black/70 dark:text-white/75">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-black dark:text-white font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 transition-all dark:focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-black dark:text-white mb-2">
                Jawatan & Peranan Utama: <span className="text-black/70 dark:text-white/75">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-black dark:text-white font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 transition-all dark:focus:border-blue-500"
              />
            </div>
          </div>

          {/* 2-Column Row 2: Agensi + Telefon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-black dark:text-white mb-2">
                Agensi / Fakulti UMK: <span className="text-black/70 dark:text-white/75">*</span>
              </label>
              <input
                type="text"
                required
                value={agency}
                onChange={(e) => setAgency(e.target.value)}
                className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-black dark:text-white font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 transition-all dark:focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-black dark:text-white mb-2">
                No. Telefon / WhatsApp: <span className="text-black/70 dark:text-white/75">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="No. Telefon / WhatsApp"
                className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-black dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 transition-all dark:focus:border-blue-500"
              />
            </div>
          </div>

          {/* Row 3: Emel Rasmi */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-black dark:text-white mb-2">
              Emel Rasmi Mentor <span className="text-black/70 dark:text-white/75">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Emel rasmi UMK / agensi"
              className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-black dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 transition-all dark:focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-black dark:text-white mb-2">
              Waktu & Hari Bimbingan Mingguan: <span className="text-black/70 dark:text-white/75">*</span>
            </label>
            <input
              type="text"
              required
              value={availableDays}
              onChange={(e) => setAvailableDays(e.target.value)}
              placeholder="Contoh: Setiap Isnin & Rabu (10:00 AM - 1:00 PM)"
              className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-black dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 transition-all dark:focus:border-blue-500"
            />
          </div>

          {/* Section: Bidang Pengkhususan */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-black dark:text-white mb-2">
              Bidang Pengkhususan & Khidmat Nasihat:
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {expertise.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/60 text-black dark:text-white border border-amber-200 dark:border-amber-800/70 rounded-lg text-xs font-medium"
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
                placeholder="Taip bidang pengkhususan baharu..."
                className="flex-1 px-4.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-black dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 transition-all dark:focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddExpertise}
                className="py-2.5 px-5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 cursor-pointer transition-all shrink-0 dark:bg-teal-600"
              >
                <Tag className="w-4 h-4" />
                <span>Tambah Bidang</span>
              </button>
            </div>
          </div>

          {/* Section: Bio / Latar Belakang */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-black dark:text-white mb-2">
              Bio & Latar Belakang Mentor:
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Pengalaman industri, anugerah, atau fokus bimbingan anda..."
              className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/55 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 transition-all dark:focus:border-blue-500"
            />
          </div>

          {/* Action Buttons Footer */}
          <div className="flex justify-end items-center gap-3 pt-5 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-5 rounded-lg text-xs sm:text-sm font-semibold text-black dark:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="py-2.5 px-6 rounded-lg text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 dark:bg-blue-600"
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
