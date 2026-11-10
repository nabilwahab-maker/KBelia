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
  const [pin, setPin] = useState(mentor.pin || '1234');
  const [expertise, setExpertise] = useState<string[]>(mentor.expertise || []);
  const [newExpertiseInput, setNewExpertiseInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

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
      setPin(mentor.pin || '1234');
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
      pin: pin.trim() || '1234',
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#24303F] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] transition-colors my-6">
        
        {/* TailAdmin Card Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 py-4.5 px-6 sm:px-7 flex items-center justify-between bg-white dark:bg-[#24303F] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-400 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {isAdminEditing ? 'Urus & Kemas Kini Profil Mentor' : 'Sunting Profil Saya (Mentor)'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Maklumat bimbingan, waktu temu janji dan saluran perhubungan rasmi Universiti Malaysia Kelantan (UMK)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 overflow-y-auto space-y-5">
          
          {successToast && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-900 dark:text-emerald-300 text-xs sm:text-sm flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{successToast}</span>
            </div>
          )}

          {/* Gambar Profil Mentor */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
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
              <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                Nama Penuh & Gelaran: <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-transparent dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                Jawatan & Peranan Utama: <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-transparent dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all"
              />
            </div>
          </div>

          {/* 2-Column Row 2: Agensi + Telefon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                Agensi / Fakulti UMK: <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={agency}
                onChange={(e) => setAgency(e.target.value)}
                className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-transparent dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                No. Telefon / WhatsApp: <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="No. Telefon / WhatsApp"
                className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm font-mono bg-transparent dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all"
              />
            </div>
          </div>

          {/* 2-Column Row 3: Emel + PIN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                Emel <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Emel"
                className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-transparent dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                  PIN Keselamatan <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400 font-medium">4-Digit</span>
              </div>
              <input
                type="text"
                maxLength={6}
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="PIN Keselamatan"
                className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm font-mono bg-transparent dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
              Waktu & Hari Bimbingan Mingguan: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={availableDays}
              onChange={(e) => setAvailableDays(e.target.value)}
              placeholder="Contoh: Setiap Isnin & Rabu (10:00 AM - 1:00 PM)"
              className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-transparent dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all"
            />
          </div>

          {/* Section: Bidang Kepakaran */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
              Bidang Kepakaran & Khidmat Nasihat:
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {expertise.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg text-xs font-medium"
                >
                  <Award className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveExpertise(tag)}
                    className="hover:text-red-600 cursor-pointer ml-1 text-slate-400 hover:text-slate-600"
                    title="Padam tag"
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
                placeholder="Taip bidang kepakaran baharu..."
                className="flex-1 px-4.5 py-2.5 text-xs sm:text-sm bg-transparent dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all"
              />
              <button
                type="button"
                onClick={handleAddExpertise}
                className="py-2.5 px-5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
              >
                <Tag className="w-4 h-4" />
                <span>Tambah Bidang</span>
              </button>
            </div>
          </div>

          {/* Section: Bio / Latar Belakang */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
              Bio & Latar Belakang Mentor:
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Pengalaman industri, anugerah, atau fokus bimbingan anda..."
              className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-transparent dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all"
            />
          </div>

          {/* TailAdmin Action Buttons Footer */}
          <div className="flex justify-end items-center gap-3 pt-5 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-5 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="py-2.5 px-6 rounded-lg text-xs sm:text-sm font-semibold text-white bg-red-700 hover:bg-red-800 shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
