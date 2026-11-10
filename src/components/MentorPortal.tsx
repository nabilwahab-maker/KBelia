import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Users, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Video, 
  MapPin, 
  MessageSquare, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  Building2, 
  ExternalLink, 
  ChevronRight, 
  AlertCircle,
  FileText,
  Sparkles,
  Award,
  Check,
  X,
  Send,
  HelpCircle,
  Lock,
  LogOut,
  Edit3,
  ShieldCheck,
  XCircle,
  Printer,
  Copy,
  Plus,
  ArrowRight,
  Sliders,
  FileCheck
} from 'lucide-react';
import { 
  MentorProfile, 
  MentorshipRegistration, 
  KelantanDistrict, 
  MentorSubTab, 
  GrantEndorsementLetter, 
  MentoringLogEntry 
} from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { MentorProfileEditModal } from './MentorProfileEditModal';
import { emitAdminOrMentorNotification } from '../services/notificationStore';

interface MentorPortalProps {
  mentors: MentorProfile[];
  registrations: MentorshipRegistration[];
  onUpdateRegistration: (updated: MentorshipRegistration) => void;
  onUpdateMentor?: (updatedMentor: MentorProfile) => void;
  onAddRegistration?: (newReg: MentorshipRegistration) => void;
  onBackToHome?: () => void;
  onOpenMentorshipClinic?: () => void;
  onOpenAdminDashboard?: () => void;
  activeSubTab?: MentorSubTab;
  onSelectSubTab?: (subTab: MentorSubTab) => void;
}

const INITIAL_ENDORSEMENTS: GrantEndorsementLetter[] = [
  {
    id: 'end-1',
    endorsementCode: 'PERAKUAN-UMK-2026-8812',
    mentorId: 'mentor-1',
    mentorName: 'Prof. Madya Dr. Nik Maheran',
    mentorAgency: 'UMK Institut Keusahawanan (UMK CEED)',
    mentorDesignation: 'Pakar Pemasaran Strategik & Keusahawanan Digital',
    menteeId: 'mentee-1',
    menteeName: 'Siti Aminah binti Yusof',
    menteePhone: '60112345678',
    businessName: 'Sambal Tok Abah Original',
    businessCategory: 'Makanan & Minuman (F&B)',
    district: 'Kota Bharu',
    recommendedAmount: 'RM3,000',
    grantProgramTitle: 'Dana Benih Usahawan Belia Kelantan (RM3,000)',
    justification: 'Usahawan menunjukkan komitmen tinggi dengan rekod jualan tunai konsisten melebihi RM4,200 sebulan. Penggunaan mesin retort pembungkusan akan melipatgandakan jangka hayat sambal dan sedia dipasarkan di Kapsul Niaga KB Sentral.',
    businessReadinessRemark: 'Telah menghadiri 3 sesi klinik bimbingan penuh dan mematuhi piawaian pembungkusan label produk UMK CEED.',
    issuedAt: '2026-03-28',
    status: 'active'
  },
  {
    id: 'end-2',
    endorsementCode: 'PERAKUAN-UMK-2026-9043',
    mentorId: 'mentor-1',
    mentorName: 'Prof. Madya Dr. Nik Maheran',
    mentorAgency: 'UMK Institut Keusahawanan (UMK CEED)',
    mentorDesignation: 'Pakar Pemasaran Strategik & Keusahawanan Digital',
    menteeId: 'mentee-2',
    menteeName: 'Muhammad Farhan bin Zulkifli',
    menteePhone: '60198765432',
    businessName: 'Kelantan Tech Solution',
    businessCategory: 'Teknologi & Servis Digital',
    district: 'Bachok',
    recommendedAmount: 'RM5,000',
    grantProgramTitle: 'Geran Pemangkin Usahawan Belia Kelantan (RM5,000)',
    justification: 'Inovasi sistem POS dan inventori awan yang dibangunkan telah diuji oleh 5 peniaga kapsul niaga UMK dengan maklum balas positif. Geran disyorkan bagi menaik taraf server awan dan perlesenan keselamatan.',
    businessReadinessRemark: 'Model perniagaan B2B yang mampan dengan unjuran pulangan modal dalam tempoh 4 bulan.',
    issuedAt: '2026-04-02',
    status: 'active'
  },
  {
    id: 'end-3',
    endorsementCode: 'PERAKUAN-UMK-2026-7734',
    mentorId: 'mentor-1',
    mentorName: 'Prof. Madya Dr. Nik Maheran',
    mentorAgency: 'UMK Institut Keusahawanan (UMK CEED)',
    mentorDesignation: 'Pakar Pemasaran Strategik & Keusahawanan Digital',
    menteeId: 'mentee-3',
    menteeName: 'Nurul Izzah binti Razak',
    menteePhone: '60133445566',
    businessName: 'Songket Warisan Cik Siti',
    businessCategory: 'Fesyen, Batik & Kraf Kelantan',
    district: 'Pasir Mas',
    recommendedAmount: 'RM5,000',
    grantProgramTitle: 'Geran Pemangkin Usahawan Belia Kelantan (RM5,000)',
    justification: 'Mempunyai keunikan rekaan moden kontemporari yang menarik minat pasaran belia dan pelancong. Dana diperlukan bagi pembelian benang emas berkualiti tinggi dan pemasaran TikTok Live berpusat.',
    businessReadinessRemark: 'Dokumen pendaftaran SSM dan penyata akaun bank syarikat lengkap dan teratur.',
    issuedAt: '2026-04-06',
    status: 'active'
  }
];

const INITIAL_LOGS: MentoringLogEntry[] = [
  {
    id: 'log-1',
    mentorId: 'mentor-1',
    menteeName: 'Siti Aminah binti Yusof',
    businessName: 'Sambal Tok Abah Original',
    sessionDate: '2026-03-25',
    topic: 'Peningkatan Kualiti Pembungkusan Retort & Pematuhan Label',
    minutes: 'Membincangkan peralihan daripada balang kaca biasa kepada pouch retort tahan suhu tinggi. Usahawan dinasihatkan menambah maklumat tarikh luput, kod bar dan logo Halal pada label baharu.',
    actionItems: [
      { id: 'act-1', task: 'Dapatkan sebut harga mesin pouch retort dari pembekal UMK', completed: true, dueDate: '2026-03-30' },
      { id: 'act-2', task: 'Ubah suai grafik label mengikut format Peraturan Makanan 1985', completed: true, dueDate: '2026-04-05' },
      { id: 'act-3', task: 'Hantar 5 sampel untuk ujian ketahanan haba di Makmal Makanan UMK', completed: false, dueDate: '2026-04-15' }
    ],
    createdAt: '2026-03-25T14:30:00Z'
  },
  {
    id: 'log-2',
    mentorId: 'mentor-1',
    menteeName: 'Muhammad Farhan bin Zulkifli',
    businessName: 'Kelantan Tech Solution',
    sessionDate: '2026-04-01',
    topic: 'Pengurusan Aliran Tunai & Pemisahan Akaun Bank Maybank Bisnes',
    minutes: 'Meneliti buku tunai syarikat. Didapati usahawan masih menggabungkan wang tunai peribadi dengan hasil langganan perisian. Prosedur perakaunan asas telah dirangka bersama mentor.',
    actionItems: [
      { id: 'act-4', task: 'Buka akaun semasa Maybank Islamic atas nama Kelantan Tech Solution', completed: true, dueDate: '2026-04-04' },
      { id: 'act-5', task: 'Aktifkan integrasi DuitNow QR khusus bisnes untuk terimaan yuran langganan', completed: false, dueDate: '2026-04-10' }
    ],
    createdAt: '2026-04-01T11:00:00Z'
  },
  {
    id: 'log-3',
    mentorId: 'mentor-1',
    menteeName: 'Wan Mohd Hafiz bin Wan Ramli',
    businessName: 'Kopi Tok Bali Craft',
    sessionDate: '2026-04-05',
    topic: 'Strategi Penentuan Harga Menu & Ujian Rasa Biji Kopi Tempatan',
    minutes: 'Menyemak kos setiap cawan (COGS) kopi bancuhan sejuk (cold brew). Margin keuntungan dicadangkan pada tahap minimum 65% untuk menampung kos sewaan tapak kapsul.',
    actionItems: [
      { id: 'act-6', task: 'Sediakan formula penetapan harga (Cost Sheet) terperinci', completed: true, dueDate: '2026-04-08' },
      { id: 'act-7', task: 'Jalankan sesi ujian rasa (blind taste test) bersama 20 mahasiswa UMK', completed: false, dueDate: '2026-04-14' }
    ],
    createdAt: '2026-04-05T16:00:00Z'
  }
];

export const MentorPortal: React.FC<MentorPortalProps> = ({
  mentors,
  registrations,
  onUpdateRegistration,
  onUpdateMentor,
  onAddRegistration,
  onBackToHome,
  onOpenMentorshipClinic,
  onOpenAdminDashboard,
  activeSubTab = 'sessions',
  onSelectSubTab
}) => {
  const { userProfile, isAdmin, openLoginModal, logout } = useAuth();
  const { t, language } = useLanguage();
  const isEn = language === 'en';
  const isMentorUser = userProfile?.role === 'mentor';
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Sub-Tab State synchronized with parent UMKSidebar
  const [currentSubTab, setCurrentSubTab] = useState<MentorSubTab>(activeSubTab);

  useEffect(() => {
    if (activeSubTab) {
      setCurrentSubTab(activeSubTab);
    }
  }, [activeSubTab]);

  const handleSubTabChange = (tab: MentorSubTab) => {
    setCurrentSubTab(tab);
    onSelectSubTab?.(tab);
  };

  // Selected Mentor ID
  const [selectedMentorId, setSelectedMentorId] = useState<string>(() => {
    if (userProfile?.role === 'mentor' && userProfile.mentorId) {
      return userProfile.mentorId;
    }
    return mentors[0]?.id || 'mentor-1';
  });

  // Endorsements State (Local Storage persistent)
  const [endorsements, setEndorsements] = useState<GrantEndorsementLetter[]>(() => {
    try {
      const saved = localStorage.getItem('kbelia_mentor_grant_endorsements');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_ENDORSEMENTS;
  });

  const saveEndorsements = (updated: GrantEndorsementLetter[]) => {
    setEndorsements(updated);
    try {
      localStorage.setItem('kbelia_mentor_grant_endorsements', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Logbook State (Local Storage persistent)
  const [logEntries, setLogEntries] = useState<MentoringLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('kbelia_mentor_action_logbook');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_LOGS;
  });

  const saveLogEntries = (updated: MentoringLogEntry[]) => {
    setLogEntries(updated);
    try {
      localStorage.setItem('kbelia_mentor_action_logbook', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Filters for Sessions Tab
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [modeFilter, setModeFilter] = useState<'all' | 'Bersemuka di Kampus' | 'Google Meet Maya'>('all');

  // Modals state
  const [selectedMenteeForNotes, setSelectedMenteeForNotes] = useState<MentorshipRegistration | null>(null);
  const [actionPlanInput, setActionPlanInput] = useState('');
  const [mentorNotesInput, setMentorNotesInput] = useState('');
  const [meetLinkInput, setMeetLinkInput] = useState('');
  const [isSuccessToast, setIsSuccessToast] = useState<string | null>(null);

  // New slot modal
  const [isNewSlotModalOpen, setIsNewSlotModalOpen] = useState(false);
  const [newSlotDate, setNewSlotDate] = useState('');
  const [newSlotTime, setNewSlotTime] = useState('10:00 AM - 11:00 AM');
  const [newSlotMode, setNewSlotMode] = useState<'Bersemuka di Kampus' | 'Google Meet Maya'>('Bersemuka di Kampus');

  // New Grant Endorsement Modal
  const [isNewEndorsementModalOpen, setIsNewEndorsementModalOpen] = useState(false);
  const [selectedEndorsementForView, setSelectedEndorsementForView] = useState<GrantEndorsementLetter | null>(null);
  const [newEndorsementMenteeName, setNewEndorsementMenteeName] = useState('');
  const [newEndorsementBusinessName, setNewEndorsementBusinessName] = useState('');
  const [newEndorsementCategory, setNewEndorsementCategory] = useState('Makanan & Minuman (F&B)');
  const [newEndorsementDistrict, setNewEndorsementDistrict] = useState<KelantanDistrict>('Kota Bharu');
  const [newEndorsementGrantType, setNewEndorsementGrantType] = useState<'RM3,000' | 'RM5,000' | 'RM10,000'>('RM3,000');
  const [newEndorsementJustification, setNewEndorsementJustification] = useState('');
  const [newEndorsementReadiness, setNewEndorsementReadiness] = useState('');
  const [isEndorsementConfirmed, setIsEndorsementConfirmed] = useState(false);

  // New Logbook Entry Modal
  const [isNewLogModalOpen, setIsNewLogModalOpen] = useState(false);
  const [newLogMenteeName, setNewLogMenteeName] = useState('');
  const [newLogBusinessName, setNewLogBusinessName] = useState('');
  const [newLogTopic, setNewLogTopic] = useState('');
  const [newLogMinutes, setNewLogMinutes] = useState('');
  const [newLogTask1, setNewLogTask1] = useState('');
  const [newLogDueDate1, setNewLogDueDate1] = useState('');
  const [newLogTask2, setNewLogTask2] = useState('');
  const [newLogDueDate2, setNewLogDueDate2] = useState('');

  // Auto-sync selected mentor with logged in mentor account
  useEffect(() => {
    if (isMentorUser && userProfile?.mentorId) {
      setSelectedMentorId(userProfile.mentorId);
    }
  }, [isMentorUser, userProfile?.mentorId]);

  const currentMentor = mentors.find(m => m.id === selectedMentorId) || mentors[0];

  // Filter registrations for the selected mentor
  const mentorRegistrations = registrations.filter(r => r.mentorId === currentMentor.id);

  const filteredRegistrations = mentorRegistrations.filter(r => {
    const matchesSearch = 
      r.entrepreneurName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.district.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesMode = modeFilter === 'all' || r.mode === modeFilter;

    return matchesSearch && matchesStatus && matchesMode;
  });

  // Calculate statistics for this mentor
  const totalMentees = mentorRegistrations.length;
  const pendingCount = mentorRegistrations.filter(r => r.status === 'pending').length;
  const confirmedCount = mentorRegistrations.filter(r => r.status === 'confirmed').length;
  const completedCount = mentorRegistrations.filter(r => r.status === 'completed').length;
  const totalEndorsementsCount = endorsements.length;
  const totalLogbookCount = logEntries.length;

  const showToast = (msg: string) => {
    setIsSuccessToast(msg);
    setTimeout(() => setIsSuccessToast(null), 4000);
  };

  const handleOpenNotesModal = (mentee: MentorshipRegistration) => {
    setSelectedMenteeForNotes(mentee);
    setActionPlanInput(mentee.mentorActionPlan || '');
    setMentorNotesInput(mentee.notes || '');
    setMeetLinkInput(mentee.meetingLink || '');
  };

  const handleSaveNotes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMenteeForNotes) return;

    const updated: MentorshipRegistration = {
      ...selectedMenteeForNotes,
      mentorActionPlan: actionPlanInput,
      notes: mentorNotesInput,
      meetingLink: meetLinkInput,
      status: selectedMenteeForNotes.status === 'pending' ? 'confirmed' : selectedMenteeForNotes.status
    };

    onUpdateRegistration(updated);
    emitAdminOrMentorNotification({
      title: `Pelan Tindakan Mentor: ${selectedMenteeForNotes.entrepreneurName}`,
      message: `${currentMentor.name} telah menghantar nota bimbingan & pelan tindakan baharu (${selectedMenteeForNotes.topic}).`,
      type: 'mentorship',
      senderRole: 'mentor',
      sender: currentMentor.name
    });
    setSelectedMenteeForNotes(null);
    showToast('Nota bimbingan & pelan tindakan berjaya dihantar kepada usahawan!');
  };

  const handleStatusChange = (mentee: MentorshipRegistration, newStatus: MentorshipRegistration['status']) => {
    const updated: MentorshipRegistration = {
      ...mentee,
      status: newStatus
    };
    onUpdateRegistration(updated);
    emitAdminOrMentorNotification({
      title: newStatus === 'confirmed' ? `Sesi Mentor Disahkan: ${mentee.entrepreneurName}` : `Sesi Mentor Selesai: ${mentee.entrepreneurName}`,
      message: `${currentMentor.name} telah mengemas kini status sesi bimbingan kepada ${newStatus === 'confirmed' ? 'Disahkan' : 'Selesai'}.`,
      type: 'mentorship',
      senderRole: 'mentor',
      sender: currentMentor.name
    });
    showToast(`Status temujanji ${mentee.entrepreneurName} dikemas kini kepada: ${newStatus === 'confirmed' ? 'Disahkan' : newStatus === 'completed' ? 'Selesai' : 'Dibatalkan'}`);
  };

  // Toggle logbook task completion
  const handleToggleLogTask = (logId: string, taskId: string) => {
    const updated = logEntries.map(log => {
      if (log.id !== logId) return log;
      return {
        ...log,
        actionItems: log.actionItems.map(task => {
          if (task.id !== taskId) return task;
          return { ...task, completed: !task.completed };
        })
      };
    });
    saveLogEntries(updated);
    showToast('Status semakan tugasan usahawan dikemaskini!');
  };

  // Issue New Grant Endorsement
  const handleCreateGrantEndorsement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEndorsementMenteeName || !newEndorsementBusinessName || !newEndorsementJustification) {
      alert('Sila lengkapkan nama usahawan, nama perniagaan dan ulasan justifikasi perakuan.');
      return;
    }
    if (!isEndorsementConfirmed) {
      alert('Sila tandakan kotak perakuan integriti profesional mentor.');
      return;
    }

    const uniqueCode = `PERAKUAN-UMK-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const programTitle = newEndorsementGrantType === 'RM3,000' 
      ? 'Dana Benih Usahawan Belia Kelantan (RM3,000)'
      : newEndorsementGrantType === 'RM5,000'
      ? 'Geran Pemangkin Usahawan Belia Kelantan (RM5,000)'
      : 'Dana Pertumbuhan & Eksport Digital (RM10,000)';

    const newEndorsement: GrantEndorsementLetter = {
      id: `end-${Date.now()}`,
      endorsementCode: uniqueCode,
      mentorId: currentMentor.id,
      mentorName: currentMentor.name,
      mentorAgency: currentMentor.agency,
      mentorDesignation: currentMentor.title,
      menteeId: `user-${Date.now()}`,
      menteeName: newEndorsementMenteeName,
      businessName: newEndorsementBusinessName,
      businessCategory: newEndorsementCategory,
      district: newEndorsementDistrict,
      recommendedAmount: newEndorsementGrantType,
      grantProgramTitle: programTitle,
      justification: newEndorsementJustification,
      businessReadinessRemark: newEndorsementReadiness || 'Telah dinilai secara profesional dalam klinik bimbingan mentor UMK.',
      issuedAt: new Date().toISOString().split('T')[0],
      status: 'active'
    };

    saveEndorsements([newEndorsement, ...endorsements]);
    setIsNewEndorsementModalOpen(false);
    setSelectedEndorsementForView(newEndorsement);
    showToast(`Surat Perakuan Rasmi ${uniqueCode} berjaya dikeluarkan!`);

    // Reset form
    setNewEndorsementMenteeName('');
    setNewEndorsementBusinessName('');
    setNewEndorsementJustification('');
    setNewEndorsementReadiness('');
    setIsEndorsementConfirmed(false);
  };

  // Add New Logbook Entry
  const handleCreateLogEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogMenteeName || !newLogBusinessName || !newLogTopic || !newLogMinutes) {
      alert('Sila isi nama mentee, bisnes, topik dan minit bimbingan.');
      return;
    }

    const actions = [];
    if (newLogTask1.trim()) {
      actions.push({
        id: `act-${Date.now()}-1`,
        task: newLogTask1.trim(),
        completed: false,
        dueDate: newLogDueDate1 || '2026-04-30'
      });
    }
    if (newLogTask2.trim()) {
      actions.push({
        id: `act-${Date.now()}-2`,
        task: newLogTask2.trim(),
        completed: false,
        dueDate: newLogDueDate2 || '2026-05-15'
      });
    }

    const newEntry: MentoringLogEntry = {
      id: `log-${Date.now()}`,
      mentorId: currentMentor.id,
      menteeName: newLogMenteeName,
      businessName: newLogBusinessName,
      sessionDate: new Date().toISOString().split('T')[0],
      topic: newLogTopic,
      minutes: newLogMinutes,
      actionItems: actions,
      createdAt: new Date().toISOString()
    };

    saveLogEntries([newEntry, ...logEntries]);
    setIsNewLogModalOpen(false);
    showToast('Log jurnal minit bimbingan berjaya direkodkan!');

    // Reset
    setNewLogMenteeName('');
    setNewLogBusinessName('');
    setNewLogTopic('');
    setNewLogMinutes('');
    setNewLogTask1('');
    setNewLogDueDate1('');
    setNewLogTask2('');
    setNewLogDueDate2('');
  };

  // Security Barrier: Only Admin or Mentor can enter
  if (!isAdmin && !isMentorUser) {
    return (
      <div className="py-8 px-4 sm:px-6 max-w-4xl mx-auto animate-in fade-in duration-300">
        <div className="bg-slate-900 dark:bg-[#1A262C] text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-purple-800/60 relative overflow-hidden text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="max-w-xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              Akses Eksklusif Peranan Mentor
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Pusat Pengurusan Mentor Bertauliah
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 dark:text-[#8A99AD] leading-relaxed">
              Bahagian ini dikhaskan untuk <strong>Mentor Bertauliah (UMK, INSKEN & SME Corp)</strong> sahaja bagi menguruskan sesi bimbingan klinik, mengeluarkan <strong>Surat Perakuan Rasmi Geran Belia</strong>, dan mencatat log jurnal tindakan. Modul ini diasingkan sepenuhnya daripada fungsi usahawan mahupun pentadbir sistem demi memelihara integriti bimbingan.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => openLoginModal('mentor')}
              className="w-full sm:w-auto px-6 py-3 bg-purple-700 hover:bg-purple-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-950/40 transition-all cursor-pointer"
            >
              <GraduationCap className="w-4 h-4 text-purple-200" />
              <span>Log Masuk Sebagai Mentor</span>
            </button>

            {onBackToHome && (
              <button
                type="button"
                onClick={onBackToHome}
                className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Kembali ke Laman Utama</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      
      {/* Toast Notification */}
      {isSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-purple-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-purple-700 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-amber-300" />
          <span className="text-xs font-semibold">{isSuccessToast}</span>
          <button onClick={() => setIsSuccessToast(null)} className="text-white/80 hover:text-white ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. MENTOR PORTAL HERO BANNER WITH UMK & KBELIA BRANDING */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-purple-800/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
              Kuasa Eksklusif Bimbingan & Perakuan Geran
            </span>
            <span className="text-xs text-purple-200/80">
              Pusat Bimbingan Usahawan Belia Universiti Malaysia Kelantan (UMK)
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5 flex-wrap">
            <span>Selamat Kembali,</span> 
            <span className="text-amber-400">{currentMentor.name}</span>
          </h1>
          
          <p className="text-xs sm:text-sm text-purple-100 max-w-2xl leading-relaxed">
            {currentMentor.title} &middot; <span className="text-amber-300 font-semibold">{currentMentor.agency}</span>
          </p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-purple-200/90 pt-1">
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg border border-white/15">
              <Phone className="w-3.5 h-3.5 text-amber-300" />
              <span>+{currentMentor.phone}</span>
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg border border-white/15">
              <Clock className="w-3.5 h-3.5 text-purple-300" />
              <span>{currentMentor.availableDays}</span>
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg border border-white/15">
              <Mail className="w-3.5 h-3.5 text-amber-300" />
              <span>{currentMentor.email}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. METRIC CARDS (4 EXECUTIVE COUNTERS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Metric 1: Total Mentees */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Jumlah Usahawan Mentee
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
            {totalMentees}
          </div>
          <span className="text-[11px] text-purple-600 dark:text-purple-400 block mt-1 font-semibold">
            {pendingCount} Menunggu Tindakan
          </span>
        </div>

        {/* Metric 2: Active / Confirmed Sessions */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Sesi Klinik Disahkan
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 tabular-nums tracking-tight">
            {confirmedCount}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
            Kampus & Google Meet Maya
          </span>
        </div>

        {/* Metric 3: Official Grant Endorsements */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-amber-200 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/10 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
              Perakuan Geran Dikeluarkan
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 tabular-nums tracking-tight">
            {totalEndorsementsCount}
          </div>
          <span className="text-[11px] text-amber-700 dark:text-amber-400 block mt-1 font-semibold">
            Sah Untuk Semakan Urus Setia
          </span>
        </div>

        {/* Metric 4: Logbook Records */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Minit & Log Tindakan
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight">
            {totalLogbookCount}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
            Garis Masa Pelan Mentee
          </span>
        </div>

      </div>

      {/* ===================================================================== */}
      {/* TAB 1: SESI BIMBINGAN & KLINIK MENTEE                                  */}
      {/* ===================================================================== */}
      {currentSubTab === 'sessions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          
          {/* Kolum 1: Senarai Permohonan Temu Janji Mentee */}
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Permohonan Bimbingan Mentee
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  {filteredRegistrations.length} Usahawan
                </span>
              </div>

              {/* Quick Search */}
              <div className="relative mb-3">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari usahawan, bisnes atau topik..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {/* Status Tabs Filter */}
              <div className="flex items-center gap-1 pb-2 mb-3 border-b border-slate-100 dark:border-slate-800 overflow-x-auto">
                {(['all', 'pending', 'confirmed', 'completed'] as const).map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setStatusFilter(tab)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                      statusFilter === tab
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {tab === 'all' ? 'Semua' : tab === 'pending' ? `Menunggu (${pendingCount})` : tab === 'confirmed' ? `Disahkan (${confirmedCount})` : `Selesai (${completedCount})`}
                  </button>
                ))}
              </div>

              {/* Mentee List Container */}
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {filteredRegistrations.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <GraduationCap className="w-8 h-8 text-slate-400 mx-auto mb-1 opacity-50" />
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Tiada rekod padanan.</p>
                  </div>
                ) : (
                  filteredRegistrations.map(mentee => {
                    const isPending = mentee.status === 'pending';
                    const isConfirmed = mentee.status === 'confirmed';
                    const isCompleted = mentee.status === 'completed';

                    return (
                      <div
                        key={mentee.id}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-all space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                              {mentee.entrepreneurName}
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {mentee.businessName} &middot; <span className="font-semibold text-purple-600 dark:text-purple-400">{mentee.topic}</span>
                            </p>
                          </div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                            isCompleted
                              ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                              : isConfirmed
                              ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300'
                              : isPending
                              ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                              : 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300'
                          }`}>
                            {isCompleted ? 'Selesai' : isConfirmed ? 'Disahkan' : isPending ? 'Menunggu' : 'Batal'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px]">
                          {(() => {
                            const rawPhone = mentee.entrepreneurPhone || (mentee as any).phone || '';
                            const cleanPhone = typeof rawPhone === 'string' ? rawPhone.replace(/[^0-9]/g, '') : '';
                            return (
                              <a
                                href={cleanPhone ? `https://wa.me/${cleanPhone}?text=Salam%20${encodeURIComponent(mentee.entrepreneurName)}` : '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                              >
                                <Phone className="w-3 h-3" />
                                <span>WhatsApp Usahawan</span>
                              </a>
                            );
                          })()}

                          <div className="flex items-center gap-1">
                            {isPending && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(mentee, 'confirmed')}
                                className="px-2 py-0.5 rounded text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
                              >
                                Sahkan
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenNotesModal(mentee)}
                              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 hover:bg-purple-200 cursor-pointer"
                            >
                              Nota Tindakan
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-3 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Bimbingan usahawan berdaftar UMK</span>
              <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">KBELIA 2026</span>
            </div>
          </div>

          {/* Kolum 2: Jadual Klinik Bimbingan & Temu Janji Aktif */}
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Jadual Klinik Terdekat
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewSlotModalOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Slot Baharu</span>
                </button>
              </div>

              {/* Upcoming Confirmed Sessions */}
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {mentorRegistrations.filter(m => m.status === 'confirmed').length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <Clock className="w-8 h-8 text-slate-400 mx-auto mb-1 opacity-50" />
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Tiada sesi klinik aktif ditetapkan.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Sahkan permohonan menunggu di Kolum 1 untuk menjadualkan temu janji.</p>
                  </div>
                ) : (
                  mentorRegistrations.filter(m => m.status === 'confirmed').map((mentee) => (
                    <div
                      key={mentee.id}
                      className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{mentee.preferredDate || 'Akan Ditetapkan'} &middot; {mentee.preferredTime || '10:00 AM'}</span>
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                          Disahkan
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {mentee.entrepreneurName} ({mentee.businessName})
                        </h4>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                          Topik: <span className="font-semibold">{mentee.topic}</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-blue-100 dark:border-blue-900/40">
                        {mentee.meetingLink ? (
                          <a
                            href={mentee.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Sertai Google Meet</span>
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>Bilik Kaunseling UMK</span>
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleStatusChange(mentee, 'completed')}
                          className="px-2.5 py-1 rounded text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Selesai Sesi</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-3 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Penyeliaan Temuduga Maya & Bersemuka</span>
              <span className="text-blue-600 dark:text-blue-400 font-bold">UMK CEED</span>
            </div>
          </div>

          {/* Kolum 3: Pelan Tindakan Ringkas Mentee */}
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Pelan Tindakan Mentee
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {mentorRegistrations.filter(m => m.mentorActionPlan).length} Disediakan
                </span>
              </div>

              {/* Action Plans Feed */}
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {mentorRegistrations.filter(m => m.mentorActionPlan).length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                    <MessageSquare className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Belum ada nota pelan tindakan.</p>
                    <p className="text-[11px] text-slate-400">Tekan "Nota Tindakan" pada senarai mentee untuk menghantar panduan perniagaan.</p>
                  </div>
                ) : (
                  mentorRegistrations.filter(m => m.mentorActionPlan).map((mentee) => (
                    <div
                      key={mentee.id}
                      className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {mentee.entrepreneurName}
                        </h4>
                        <button
                          type="button"
                          onClick={() => handleOpenNotesModal(mentee)}
                          className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          Kemaskini
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-slate-300 whitespace-pre-line bg-white/70 dark:bg-slate-900/50 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900/40 leading-relaxed font-sans">
                        {mentee.mentorActionPlan}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Topik: {mentee.topic}</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Tersimpan</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-3 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Pemantauan Prestasi Usahawan</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Patuh KPI</span>
            </div>
          </div>

        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: PERAKUAN RASMI GERAN BELIA (OFFICIAL GRANT ENDORSEMENT)       */}
      {/* ===================================================================== */}
      {currentSubTab === 'endorsements' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Header Action Banner */}
          <div className="p-5 bg-gradient-to-r from-amber-500/15 via-purple-500/10 to-indigo-500/10 rounded-2xl border border-amber-300/80 dark:border-amber-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Pengeluaran Surat Perakuan Rasmi Geran Belia UMK
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                Mentor bertauliah mempunyai autoriti rasmi untuk menilai usahawan dan mengeluarkan Surat Perakuan Sokongan Geran. Dokumen digital bertandatangan rasmi ini diperlukan oleh urus setia kerajaan bagi kelulusan pembiayaan Dana Benih (RM3,000) dan Geran Pemangkin (RM5,000).
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsNewEndorsementModalOpen(true)}
              className="interactive-press interactive-lift px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>Keluarkan Surat Perakuan Baharu</span>
            </button>
          </div>

          {/* List of Issued Endorsements */}
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Senarai Surat Perakuan Geran yang Telah Dikeluarkan ({endorsements.length})
                </h4>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Disahkan oleh Universiti Malaysia Kelantan
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {endorsements.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 p-4 space-y-3 hover:border-amber-400 dark:hover:border-amber-500 transition-all shadow-2xs flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/80 px-2 py-0.5 rounded">
                        {item.endorsementCode}
                      </span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>Disahkan Rasmi</span>
                      </span>
                    </div>

                    <div>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.menteeName}
                      </h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {item.businessName} &middot; <span className="font-medium text-slate-700 dark:text-slate-300">{item.district}</span>
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 space-y-1">
                      <div className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300">
                        {item.grantProgramTitle}
                      </div>
                      <div className="text-base font-black text-amber-600 dark:text-amber-400">
                        {item.recommendedAmount}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed italic bg-white/60 dark:bg-slate-900/40 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                      "{item.justification}"
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400">
                      Tarikh: {item.issuedAt}
                    </span>

                    <button
                      type="button"
                      onClick={() => setSelectedEndorsementForView(item)}
                      className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-[11px] rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Lihat & Cetak Surat</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: LOG JURNAL & PELAN TINDAKAN MENTEE                              */}
      {/* ===================================================================== */}
      {currentSubTab === 'logbook' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          <div className="p-5 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 rounded-2xl border border-purple-200 dark:border-purple-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-700 dark:text-purple-400 shrink-0" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Log Jurnal Bimbingan & Pelan Tindakan Berstruktur
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                Catatkan minit mesyuarat bimbingan, garis masa sasaran peniaga, dan senarai tugasan wajib mentee. Anda boleh menyemak kemajuan tugasan secara berterusan bagi memastikan objektif inkubasi tercapai.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsNewLogModalOpen(true)}
              className="interactive-press interactive-lift px-5 py-2.5 bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Catat Log Jurnal Baharu</span>
            </button>
          </div>

          <div className="space-y-4">
            {logEntries.map((log) => (
              <div
                key={log.id}
                className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider block">
                      Tarikh Sesi: {log.sessionDate}
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      {log.menteeName} &middot; <span className="text-purple-700 dark:text-purple-400">{log.businessName}</span>
                    </h4>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 w-fit">
                    Topik: {log.topic}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Ringkasan Minit Bimbingan Mentor:
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 leading-relaxed font-sans">
                    {log.minutes}
                  </p>
                </div>

                {log.actionItems && log.actionItems.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Senarai Semak Tugasan Wajib Mentee:</span>
                      <span className="text-[11px] text-slate-400 font-normal">Tekan kotak untuk tandakan status selesai</span>
                    </div>

                    <div className="space-y-2">
                      {log.actionItems.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => handleToggleLogTask(log.id, task.id)}
                          className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                            task.completed
                              ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-slate-500 dark:text-slate-400 line-through'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 text-slate-900 dark:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                              task.completed
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700'
                            }`}>
                              {task.completed && <Check className="w-3.5 h-3.5" />}
                            </div>
                            <span className="text-xs font-medium">{task.task}</span>
                          </div>

                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                            task.completed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}>
                            Sasaran: {task.dueDate}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: PROFIL MENTOR & JADUAL KELAPANGAN                              */}
      {/* ===================================================================== */}
      {currentSubTab === 'profile' && (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-6 animate-in fade-in duration-200">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Profil & Kredensial Mentor Bertauliah
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Maklumat ini dipaparkan kepada usahawan belia yang ingin memohon bimbingan perniagaan.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsEditProfileOpen(true)}
              className="interactive-press interactive-lift px-5 py-2.5 bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Sunting Maklumat Profil</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  Nama Penuh & Gelaran:
                </label>
                <div className="text-sm font-bold text-slate-900 dark:text-white p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  {currentMentor.name}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  Jawatan & Agensi:
                </label>
                <div className="text-sm font-medium text-slate-900 dark:text-white p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  {currentMentor.title} &middot; <span className="font-bold text-purple-700 dark:text-purple-400">{currentMentor.agency}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  Saluran Perhubungan Rasmi:
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <span>WhatsApp: +{currentMentor.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <Mail className="w-4 h-4 text-purple-600" />
                    <span>Emel Rasmi: {currentMentor.email}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  Waktu & Hari Kelapangan Bimbingan:
                </label>
                <div className="text-sm font-bold text-slate-900 dark:text-white p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>{currentMentor.availableDays}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  Bidang Kepakaran Bimbingan:
                </label>
                <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  {currentMentor.expertise.map((exp, idx) => (
                    <span key={idx} className="text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300 px-3 py-1 rounded-lg">
                      {exp}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  Biodata Ringkas Mentor:
                </label>
                <p className="text-xs text-slate-600 dark:text-slate-300 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 leading-relaxed font-sans">
                  {currentMentor.bio}
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: BORANG KELUARKAN PERAKUAN GERAN BAHARU (MENTOR-ONLY)         */}
      {/* ===================================================================== */}
      {isNewEndorsementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-amber-300 dark:border-amber-700 max-h-[92vh] overflow-y-auto space-y-4">
            
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Borang Perakuan Rasmi Geran Belia
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Universiti Malaysia Kelantan &bull; Hab Usahawan Belia KBELIA
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewEndorsementModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGrantEndorsement} className="space-y-3.5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Penuh Usahawan:
                  </label>
                  <input
                    type="text"
                    required
                    value={newEndorsementMenteeName}
                    onChange={(e) => setNewEndorsementMenteeName(e.target.value)}
                    placeholder="Cth: Siti Aminah binti Yusof"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Syarikat / Jenama:
                  </label>
                  <input
                    type="text"
                    required
                    value={newEndorsementBusinessName}
                    onChange={(e) => setNewEndorsementBusinessName(e.target.value)}
                    placeholder="Cth: Sambal Tok Abah Original"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kategori Perniagaan:
                  </label>
                  <select
                    value={newEndorsementCategory}
                    onChange={(e) => setNewEndorsementCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Makanan & Minuman (F&B)">Makanan & Minuman (F&B)</option>
                    <option value="Fesyen, Batik & Kraf Kelantan">Fesyen, Batik & Kraf Kelantan</option>
                    <option value="Teknologi & Servis Digital">Teknologi & Servis Digital</option>
                    <option value="Kecantikan & Kesihatan">Kecantikan & Kesihatan</option>
                    <option value="Pertanian & Agrotek">Pertanian & Agrotek</option>
                    <option value="Runcit & Gaya Hidup">Runcit & Gaya Hidup</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Jajahan Operasi:
                  </label>
                  <select
                    value={newEndorsementDistrict}
                    onChange={(e) => setNewEndorsementDistrict(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Kota Bharu">Kota Bharu</option>
                    <option value="Bachok">Bachok</option>
                    <option value="Pasir Mas">Pasir Mas</option>
                    <option value="Tumpat">Tumpat</option>
                    <option value="Tanah Merah">Tanah Merah</option>
                    <option value="Machang">Machang</option>
                    <option value="Pasir Puteh">Pasir Puteh</option>
                    <option value="Kuala Krai">Kuala Krai</option>
                    <option value="Gua Musang">Gua Musang</option>
                    <option value="Jeli">Jeli</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cadangan Jenis Geran Bantuan:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewEndorsementGrantType('RM3,000')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      newEndorsementGrantType === 'RM3,000'
                        ? 'bg-amber-100 text-amber-900 border-amber-500 font-bold dark:bg-amber-950/70 dark:text-amber-300'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-semibold">Dana Benih</div>
                    <div className="text-sm font-black">RM3,000</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewEndorsementGrantType('RM5,000')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      newEndorsementGrantType === 'RM5,000'
                        ? 'bg-amber-100 text-amber-900 border-amber-500 font-bold dark:bg-amber-950/70 dark:text-amber-300'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-semibold">Geran Pemangkin</div>
                    <div className="text-sm font-black">RM5,000</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewEndorsementGrantType('RM10,000')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      newEndorsementGrantType === 'RM10,000'
                        ? 'bg-amber-100 text-amber-900 border-amber-500 font-bold dark:bg-amber-950/70 dark:text-amber-300'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-semibold">Dana Pertumbuhan</div>
                    <div className="text-sm font-black">RM10,000</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ulasan Justifikasi Mentor (Mengapa usahawan ini disokong):
                </label>
                <textarea
                  required
                  rows={3}
                  value={newEndorsementJustification}
                  onChange={(e) => setNewEndorsementJustification(e.target.value)}
                  placeholder="Terangkan komitmen usahawan, prestasi jualan, potensi produk, dan impak penggunaan dana geran terhadap perkembangan perniagaan..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Kesediaan Bisnes & Kematangan Operasi:
                </label>
                <input
                  type="text"
                  value={newEndorsementReadiness}
                  onChange={(e) => setNewEndorsementReadiness(e.target.value)}
                  placeholder="Cth: Telah lulus 3 sesi klinik mentor & mematuhi piawaian pembungkusan UMK"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/40">
                <label className="flex items-start gap-2.5 text-xs text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEndorsementConfirmed}
                    onChange={(e) => setIsEndorsementConfirmed(e.target.checked)}
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="leading-relaxed">
                    Saya dengan ini memperakui bahawa saya telah menyemak dokumen perniagaan dan membimbing usahawan belia ini. Perakuan ini dibuat dengan penuh integriti bagi kegunaan urus setia kerajaan.
                  </span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewEndorsementModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Award className="w-4 h-4" />
                  <span>Jana Surat Perakuan Rasmi</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: PAPARAN SURAT PERAKUAN RASMI MENTOR (OFFICIAL LETTER VIEW)   */}
      {/* ===================================================================== */}
      {selectedEndorsementForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[94vh] overflow-y-auto space-y-6">
            
            {/* Action Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-bold text-purple-800 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-600" />
                Dokumen Rasmi Sokongan Geran Belia
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedEndorsementForView(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Letterhead */}
            <div className="text-center space-y-1 pb-4 border-b-2 border-slate-900">
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-900 text-white flex items-center justify-center font-black text-sm">
                  UMK
                </div>
                <div className="text-left">
                  <h3 className="font-black text-base tracking-tight text-slate-950 uppercase">
                    UNIVERSITI MALAYSIA KELANTAN
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                    INSTITUT KEUSAHAWANAN UMK (UMK CEED) &bull; HAB NIAGA BELIA KELANTAN
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 pt-1">
                Kampus Kota, Pengkalan Chepa, 16100 Kota Bharu, Kelantan &bull; Tel: +609-771 7000
              </p>
            </div>

            {/* Reference Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2 pt-1 font-mono">
              <div>
                <span className="text-slate-500 font-sans">No. Rujukan: </span>
                <strong className="text-purple-900">{selectedEndorsementForView.endorsementCode}</strong>
              </div>
              <div>
                <span className="text-slate-500 font-sans">Tarikh Perakuan: </span>
                <strong>{selectedEndorsementForView.issuedAt}</strong>
              </div>
            </div>

            {/* Recipient */}
            <div className="text-xs space-y-1">
              <p className="font-semibold text-slate-700">Kepada:</p>
              <p className="font-bold text-slate-900">Urus Setia Jawatankuasa Penilaian Geran Usahawan Belia Kelantan</p>
              <p className="text-slate-600">Pusat Pembangunan Usahawan Belia & Majlis Tindakan Ekonomi Negeri</p>
            </div>

            {/* Title */}
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-center">
              <h4 className="font-bold text-sm text-purple-950 uppercase">
                SURAT PERAKUAN SOKONGAN MENTOR BERTAULIAH
              </h4>
              <p className="text-xs font-semibold text-amber-700 mt-0.5">
                {selectedEndorsementForView.grantProgramTitle} ({selectedEndorsementForView.recommendedAmount})
              </p>
            </div>

            {/* Letter Body */}
            <div className="text-xs text-slate-800 space-y-3 leading-relaxed font-serif">
              <p>
                Dengan segala hormatnya dimaklumkan bahawa saya, <strong>{selectedEndorsementForView.mentorName}</strong>, 
                selaku Mentor Bertauliah di bawah <strong>{selectedEndorsementForView.mentorAgency}</strong> telah membimbing dan 
                menilai potensi perniagaan penama di bawah:
              </p>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-sans space-y-1 text-xs">
                <div><strong>Nama Usahawan Belia:</strong> {selectedEndorsementForView.menteeName}</div>
                <div><strong>Nama Syarikat / Jenama:</strong> {selectedEndorsementForView.businessName}</div>
                <div><strong>Kategori Perniagaan:</strong> {selectedEndorsementForView.businessCategory}</div>
                <div><strong>Jajahan Operasi:</strong> {selectedEndorsementForView.district}</div>
                <div><strong>Nilai Bantuan Diperakukan:</strong> <span className="font-bold text-purple-800">{selectedEndorsementForView.recommendedAmount}</span></div>
              </div>

              <div className="space-y-1 font-sans">
                <strong className="text-slate-900">Ulasan Justifikasi Mentor:</strong>
                <p className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 italic text-slate-800 leading-relaxed">
                  "{selectedEndorsementForView.justification}"
                </p>
              </div>

              <div className="space-y-1 font-sans">
                <strong className="text-slate-900">Penilaian Tahap Kesediaan Operasi:</strong>
                <p className="text-slate-700">
                  {selectedEndorsementForView.businessReadinessRemark}
                </p>
              </div>

              <p className="font-sans text-slate-700">
                Sehubungan itu, pihak kami memperakui penuh permohonan ini untuk pertimbangan kelulusan dana geran oleh pihak urus setia.
              </p>
            </div>

            {/* Signature & Seal Block */}
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-end justify-between gap-4 font-sans text-xs">
              <div className="space-y-2">
                <div className="w-24 h-12 border-b-2 border-slate-800 flex items-end">
                  <span className="font-serif italic text-purple-900 font-bold text-sm">N.Maheran</span>
                </div>
                <div>
                  <strong className="block text-slate-900">{selectedEndorsementForView.mentorName}</strong>
                  <span className="text-slate-600 block">{selectedEndorsementForView.mentorDesignation || 'Mentor Bertauliah'}</span>
                  <span className="text-slate-500 block">{selectedEndorsementForView.mentorAgency}</span>
                </div>
              </div>

              <div className="text-center sm:text-right">
                <div className="inline-block p-3 rounded-2xl bg-amber-50 border-2 border-amber-400 text-center">
                  <ShieldCheck className="w-7 h-7 text-amber-600 mx-auto mb-1" />
                  <span className="font-black text-[10px] text-amber-900 uppercase tracking-wider block">
                    PENGESAHAN DIGITAL UMK
                  </span>
                  <span className="font-mono text-[9px] text-slate-500 block">
                    STATUS: SAH DIPERAKUKAN
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: TAMBAH MINIT LOG JURNAL & TUGASAN MENTEE                     */}
      {/* ===================================================================== */}
      {isNewLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-purple-300 dark:border-purple-800 max-h-[92vh] overflow-y-auto space-y-4">
            
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Catat Minit Log Jurnal Bimbingan
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Rekod minit perbincangan dan tugasan mentee
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewLogModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLogEntry} className="space-y-3.5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Usahawan Mentee:
                  </label>
                  <input
                    type="text"
                    required
                    value={newLogMenteeName}
                    onChange={(e) => setNewLogMenteeName(e.target.value)}
                    placeholder="Cth: Siti Aminah"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Perniagaan:
                  </label>
                  <input
                    type="text"
                    required
                    value={newLogBusinessName}
                    onChange={(e) => setNewLogBusinessName(e.target.value)}
                    placeholder="Cth: Sambal Tok Abah"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Topik Bimbingan:
                </label>
                <input
                  type="text"
                  required
                  value={newLogTopic}
                  onChange={(e) => setNewLogTopic(e.target.value)}
                  placeholder="Cth: Penetapan Harga & Pemasaran TikTok Shop"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Minit & Ringkasan Perbincangan:
                </label>
                <textarea
                  required
                  rows={3}
                  value={newLogMinutes}
                  onChange={(e) => setNewLogMinutes(e.target.value)}
                  placeholder="Catatkan nasihat mentor, isu aliran tunai atau penemuan klinik..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-sans leading-relaxed"
                />
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tugasan Wajib Usahawan (Action Checklist):
                </label>
                
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newLogTask1}
                    onChange={(e) => setNewLogTask1(e.target.value)}
                    placeholder="Tugasan 1 (Cth: Buka akaun bank)"
                    className="col-span-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={newLogDueDate1}
                    onChange={(e) => setNewLogDueDate1(e.target.value)}
                    placeholder="Tarikh sasaran"
                    className="px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newLogTask2}
                    onChange={(e) => setNewLogTask2(e.target.value)}
                    placeholder="Tugasan 2 (Cth: Hantar borang SSM)"
                    className="col-span-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={newLogDueDate2}
                    onChange={(e) => setNewLogDueDate2(e.target.value)}
                    placeholder="Tarikh sasaran"
                    className="px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewLogModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-400"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-700 hover:bg-purple-600 shadow-sm"
                >
                  Simpan Log Jurnal
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 4: NOTA BIMBINGAN & PELAN TINDAKAN MENTEE DARI KOLUM 1          */}
      {/* ===================================================================== */}
      {selectedMenteeForNotes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-purple-300 dark:border-purple-900 max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-start justify-between gap-4 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Nota Nasihat & Pelan Tindakan Usahawan
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Untuk: <span className="font-bold text-purple-700 dark:text-purple-300">{selectedMenteeForNotes.entrepreneurName}</span> ({selectedMenteeForNotes.businessName})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMenteeForNotes(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNotes} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Pelan Tindakan Usahawan (Action Items / Checklist):
                </label>
                <textarea
                  rows={4}
                  value={actionPlanInput}
                  onChange={(e) => setActionPlanInput(e.target.value)}
                  placeholder="Contoh:&#10;1. Sediakan 3 video promosi menu baharu sebelum 28 Mac.&#10;2. Buka akaun perniagaan khusus untuk elak campur duit peribadi.&#10;3. Hadiri bengkel pengurusan inventori UMK."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 leading-relaxed font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Dalaman Mentor (Private Notes):
                </label>
                <textarea
                  rows={2}
                  value={mentorNotesInput}
                  onChange={(e) => setMentorNotesInput(e.target.value)}
                  placeholder="Catatan prestasi, komitmen usahawan atau cadangan susulan..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Pautan Google Meet / Maya (Pilihan):
                </label>
                <input
                  type="url"
                  value={meetLinkInput}
                  onChange={(e) => setMeetLinkInput(e.target.value)}
                  placeholder="https://meet.google.com/abc-defg-hij"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMenteeForNotes(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-700 hover:bg-purple-600 shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Simpan & Hantar Nota</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 5: BUKA SLOT KONSULTASI BAHARU                                  */}
      {/* ===================================================================== */}
      {isNewSlotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Buka Slot Jadual Bimbingan Baharu
              </h3>
              <button onClick={() => setIsNewSlotModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tarikh Sesi:
                </label>
                <input
                  type="text"
                  value={newSlotDate}
                  onChange={(e) => setNewSlotDate(e.target.value)}
                  placeholder="Cth: 12 April 2026 (Ahad)"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Masa Sesi:
                </label>
                <input
                  type="text"
                  value={newSlotTime}
                  onChange={(e) => setNewSlotTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Mod Bimbingan:
                </label>
                <select
                  value={newSlotMode}
                  onChange={(e) => setNewSlotMode(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                >
                  <option value="Bersemuka di Kampus">Bersemuka di Kampus (Bilik Bimbingan UMK)</option>
                  <option value="Google Meet Maya">Google Meet Maya</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewSlotModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-400"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsNewSlotModalOpen(false);
                    showToast('Slot bimbingan baharu berjaya diterbitkan untuk usahawan belia!');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-700 hover:bg-purple-600 shadow-sm"
                >
                  Terbitkan Slot
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mentor Profile Edit Modal */}
      <MentorProfileEditModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        mentor={currentMentor}
        isAdminEditing={isAdmin && !isMentorUser}
        onSave={(updated) => {
          onUpdateMentor?.(updated);
          showToast('Profil mentor berjaya dikemas kini!');
        }}
      />

    </div>
  );
};
