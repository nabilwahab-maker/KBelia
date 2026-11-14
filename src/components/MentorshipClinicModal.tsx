import React, { useState } from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  X, 
  MapPin, 
  Video, 
  GraduationCap, 
  Send, 
  Sparkles, 
  Award,
  ChevronRight,
  Phone,
  Building2
} from 'lucide-react';
import { MentorProfile, MentorshipRegistration, KelantanDistrict } from '../types';
import { INITIAL_MENTOR_PROFILES } from '../data/mentorData';

interface MentorshipClinicModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentors?: MentorProfile[];
  onBookMentorship?: (registration: MentorshipRegistration) => void;
  defaultEntrepreneurName?: string;
  defaultBusinessName?: string;
  defaultPhone?: string;
  defaultDistrict?: KelantanDistrict;
}

export const MentorshipClinicModal: React.FC<MentorshipClinicModalProps> = ({
  isOpen,
  onClose,
  mentors = INITIAL_MENTOR_PROFILES,
  onBookMentorship,
  defaultEntrepreneurName = 'Ahmad Nabil Bin Yusoff',
  defaultBusinessName = 'Kopi Tok Bali & Pastri Pantai',
  defaultPhone = '',
  defaultDistrict = 'Pasir Puteh'
}) => {
  const [selectedMentor, setSelectedMentor] = useState<MentorProfile | null>(null);
  
  // Booking Form States
  const [entrepreneurName, setEntrepreneurName] = useState(defaultEntrepreneurName);
  const [businessName, setBusinessName] = useState(defaultBusinessName);
  const [entrepreneurPhone, setEntrepreneurPhone] = useState(defaultPhone);
  const [district, setDistrict] = useState<KelantanDistrict>(defaultDistrict);
  const [topic, setTopic] = useState('Strategi Pemasaran Digital & TikTok Shop');
  const [challenges, setChallenges] = useState('');
  const [preferredDate, setPreferredDate] = useState('28 Mac 2026 (Sabtu)');
  const [preferredTime, setPreferredTime] = useState('10:00 AM - 11:00 AM');
  const [mode, setMode] = useState<'Bersemuka di Kampus' | 'Google Meet Maya'>('Bersemuka di Kampus');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartBooking = (mentor: MentorProfile) => {
    setSelectedMentor(mentor);
    setIsSubmitted(false);
    setValidationError(null);
  };

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!entrepreneurName.trim() || !businessName.trim() || !entrepreneurPhone.trim()) {
      setValidationError('Sila lengkapkan nama usahawan, nama perniagaan, dan nombor WhatsApp.');
      return;
    }

    if (!selectedMentor) return;

    const newRegistration: MentorshipRegistration = {
      id: `mentee-reg-${Date.now()}`,
      mentorId: selectedMentor.id,
      mentorName: selectedMentor.name,
      entrepreneurName: entrepreneurName.trim(),
      entrepreneurPhone: entrepreneurPhone.trim(),
      entrepreneurEmail: 'usahawan@kbelia.my',
      businessName: businessName.trim(),
      district: district,
      businessCategory: 'Makanan & Minuman (F&B)',
      topic: topic,
      challenges: challenges.trim() || 'Mahu bimbingan praktikal untuk meningkatkan jualan dan pengurusan kiosk.',
      preferredDate: preferredDate,
      preferredTime: preferredTime,
      mode: mode,
      status: 'pending',
      notes: 'Permohonan baharu melalui Klinik Usahawan Kaunter Pantas.',
      createdAt: new Date().toISOString()
    };

    if (onBookMentorship) {
      onBookMentorship(newRegistration);
    }

    setIsSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-300 dark:border-slate-600 scale-100 transition-all max-h-[92vh] flex flex-col overflow-hidden my-6"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="border-b border-slate-300 dark:border-slate-600 py-4.5 px-6 sm:px-7 flex items-center justify-between kbelia-important-header shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/70 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-black dark:text-white tracking-tight">
                Hab Temujanji Klinik Usahawan & Mentor
              </h3>
              <p className="text-xs text-black dark:text-white">
                Bimbingan 1-ke-1 Percuma Bersama Mentor UMK & Industri (Tajaan Dana Belia)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto">
          {/* View 1: Success Screen */}
          {isSubmitted ? (
            <div className="py-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-black dark:text-white/75 flex items-center justify-center mx-auto border border-emerald-300">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              
              <div className="space-y-1">
                <h4 className="text-base sm:text-lg font-bold text-black dark:text-white">
                  Permohonan Bimbingan Berjaya Dihantar!
                </h4>
                <p className="text-xs sm:text-sm text-black dark:text-white max-w-md mx-auto">
                  Permohonan anda telah dihantar terus ke papan pemuka <span className="font-bold text-black dark:text-white/75">{selectedMentor?.name}</span>. Mentor akan menyemak butiran dan mengesahkan temujanji anda.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 p-4.5 rounded-xl border border-slate-300 dark:border-slate-600 max-w-md mx-auto text-left text-xs sm:text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-black/70 dark:text-white/75 font-medium">Mentor:</span>
                  <span className="font-bold text-black dark:text-white">{selectedMentor?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/70 dark:text-white/75 font-medium">Usahawan / Perniagaan:</span>
                  <span className="font-semibold text-black dark:text-white">{entrepreneurName} ({businessName})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/70 dark:text-white/75 font-medium">Tarikh & Waktu:</span>
                  <span className="font-semibold text-black dark:text-white">{preferredDate} &middot; {preferredTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/70 dark:text-white/75 font-medium">Mod Bimbingan:</span>
                  <span className="font-bold text-black dark:text-white/75">{mode}</span>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMentor(null);
                    setIsSubmitted(false);
                  }}
                  className="py-2.5 px-5 rounded-lg text-xs sm:text-sm font-semibold text-black dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Pilih Mentor Lain
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-6 rounded-lg text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-all cursor-pointer dark:bg-teal-600"
                >
                  Selesai & Tutup
                </button>
              </div>
            </div>
          ) : selectedMentor ? (
            /* View 2: Booking Form for Selected Mentor */
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/70 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-black dark:text-white">{selectedMentor.name}</div>
                    <div className="text-xs text-black dark:text-white/75">{selectedMentor.title} &middot; {selectedMentor.agency}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMentor(null)}
                  className="text-xs font-semibold text-black dark:text-white/75 hover:underline cursor-pointer"
                >
                  Tukar Mentor
                </button>
              </div>

              {validationError && (
                <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-black dark:text-white flex items-center gap-2">
                  <span>{validationError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitBooking} className="space-y-5">
                {/* 2-Column Row 1: Nama Usahawan + Telefon */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-black dark:text-white mb-2">
                      Nama Penuh Usahawan: <span className="text-black dark:text-white">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={entrepreneurName}
                      onChange={(e) => setEntrepreneurName(e.target.value)}
                      className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 transition-all dark:focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-black dark:text-white mb-2">
                      Nombor WhatsApp: <span className="text-black dark:text-white">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={entrepreneurPhone}
                      onChange={(e) => setEntrepreneurPhone(e.target.value)}
                      placeholder="Nombor telefon"
                      className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm font-mono bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 transition-all dark:focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* 2-Column Row 2: Nama Perniagaan + Jajahan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-black dark:text-white mb-2">
                      Nama Perniagaan / Kiosk: <span className="text-black dark:text-white">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 transition-all dark:focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-black dark:text-white mb-2">
                      Jajahan Premis: <span className="text-black dark:text-white">*</span>
                    </label>
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value as KelantanDistrict)}
                      className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 transition-all cursor-pointer dark:focus:border-blue-500"
                    >
                      <option value="Kota Bharu" className="dark:bg-slate-900">Kota Bharu</option>
                      <option value="Bachok" className="dark:bg-slate-900">Bachok</option>
                      <option value="Pasir Mas" className="dark:bg-slate-900">Pasir Mas</option>
                      <option value="Tumpat" className="dark:bg-slate-900">Tumpat</option>
                      <option value="Tanah Merah" className="dark:bg-slate-900">Tanah Merah</option>
                      <option value="Machang" className="dark:bg-slate-900">Machang</option>
                      <option value="Pasir Puteh" className="dark:bg-slate-900">Pasir Puteh</option>
                      <option value="Kuala Krai" className="dark:bg-slate-900">Kuala Krai</option>
                      <option value="Gua Musang" className="dark:bg-slate-900">Gua Musang</option>
                      <option value="Jeli" className="dark:bg-slate-900">Jeli</option>
                    </select>
                  </div>
                </div>

                {/* Topik Bimbingan */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-black dark:text-white mb-2">
                    Topik Bimbingan Utama yang Diperlukan: <span className="text-black dark:text-white">*</span>
                  </label>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-emerald-600 transition-all cursor-pointer dark:focus:border-blue-500"
                  >
                    <option value="Strategi Pemasaran Digital & TikTok Shop" className="dark:bg-slate-900">Strategi Pemasaran Digital & TikTok Shop</option>
                    <option value="Pengurusan Aliran Tunai & Penyata Kewangan Kiosk" className="dark:bg-slate-900">Pengurusan Aliran Tunai & Penyata Kewangan Kiosk</option>
                    <option value="Permohonan Pembiayaan TEKUN, MARA & Geran Negeri" className="dark:bg-slate-900">Permohonan Pembiayaan TEKUN, MARA & Geran Negeri</option>
                    <option value="Penembusan Pasaran Eksport & Fesyen Batik Warisan" className="dark:bg-slate-900">Penembusan Pasaran Eksport & Fesyen Batik Warisan</option>
                    <option value="Pensijilan Halal JAKIM & Piawaian Makanan MeSTI" className="dark:bg-slate-900">Pensijilan Halal JAKIM & Piawaian Makanan MeSTI</option>
                    <option value="Rundingan Pembekal & Pengurusan Inventori" className="dark:bg-slate-900">Rundingan Pembekal & Pengurusan Inventori</option>
                  </select>
                </div>

                {/* Cabaran Khusus */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-black dark:text-white mb-2">
                    Keterangan Cabaran / Soalan Khusus untuk Mentor:
                  </label>
                  <textarea
                    rows={2}
                    value={challenges}
                    onChange={(e) => setChallenges(e.target.value)}
                    placeholder="Nyatakan soalan atau cabaran anda secara ringkas..."
                    className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/55 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 transition-all dark:focus:border-blue-500"
                  />
                </div>

                {/* 2-Column Row 3: Tarikh + Mod */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-black dark:text-white mb-2">
                      Pilihan Tarikh & Masa: <span className="text-black dark:text-white">*</span>
                    </label>
                    <select
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 transition-all cursor-pointer dark:focus:border-blue-500"
                    >
                      <option value="28 Mac 2026 (Sabtu)" className="dark:bg-slate-900">28 Mac 2026 (Sabtu) - 10:00 AM</option>
                      <option value="30 Mac 2026 (Isnin)" className="dark:bg-slate-900">30 Mac 2026 (Isnin) - 11:30 AM</option>
                      <option value="2 April 2026 (Khamis)" className="dark:bg-slate-900">2 April 2026 (Khamis) - 2:30 PM</option>
                      <option value="5 April 2026 (Ahad)" className="dark:bg-slate-900">5 April 2026 (Ahad) - 10:00 AM</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-black dark:text-white mb-2">
                      Mod Sesi Bimbingan: <span className="text-black dark:text-white">*</span>
                    </label>
                    <select
                      value={mode}
                      onChange={(e) => setMode(e.target.value as any)}
                      className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 transition-all cursor-pointer dark:focus:border-blue-500"
                    >
                      <option value="Bersemuka di Kampus" className="dark:bg-slate-900">Bersemuka di Kampus UMK</option>
                      <option value="Google Meet Maya" className="dark:bg-slate-900">Google Meet Maya (Atas Talian)</option>
                    </select>
                  </div>
                </div>

                {/* Action Buttons Footer */}
                <div className="flex justify-end items-center gap-3 pt-5 border-t border-slate-300 dark:border-slate-600">
                  <button
                    type="button"
                    onClick={() => setSelectedMentor(null)}
                    className="py-2.5 px-5 rounded-lg text-xs sm:text-sm font-semibold text-black dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 px-6 rounded-lg text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-all flex items-center gap-2 cursor-pointer dark:bg-teal-600"
                  >
                    <Send className="w-4 h-4" />
                    <span>Hantar Permohonan Bimbingan</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* View 3: Mentor List */
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-black dark:text-white leading-relaxed">
                Pilih mentor daripada Universiti Malaysia Kelantan (UMK) dan industri untuk mendapatkan maklum balas perniagaan, penetapan harga, atau pelan pensijilan secara percuma.
              </p>

              <div className="flex flex-col gap-3.5">
                {mentors.map((mentor) => (
                  <div
                    key={mentor.id}
                    className="p-4 sm:p-5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-teal-600 transition-all shadow-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-black dark:text-white border border-teal-200 dark:border-teal-800/70">
                            {mentor.agency}
                          </span>
                          <span className="text-[11px] text-black/70 dark:text-white/75">&bull; {mentor.availableDays}</span>
                        </div>
                        
                        <h4 className="text-sm sm:text-base font-bold text-black dark:text-white">
                          {mentor.name}
                        </h4>
                        <p className="text-xs text-black dark:text-white/75">
                          {mentor.title}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleStartBooking(mentor)}
                        className="py-2 px-4 rounded-lg text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-xs shrink-0 cursor-pointer self-start sm:self-auto flex items-center gap-1.5 dark:bg-teal-600"
                      >
                        <span>Pilih Mentor & Tempah</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Expertise Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-2.5 border-t border-slate-300 dark:border-slate-600">
                      {mentor.expertise.map((exp, idx) => (
                        <span key={idx} className="text-[10px] font-medium bg-slate-50 dark:bg-slate-900 text-black dark:text-white px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-600">
                          {exp}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
