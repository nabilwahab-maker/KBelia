import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Users, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Video, 
  MapPin, 
  LayoutDashboard, 
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
    mentorDesignation: 'Mentor Pemasaran Strategik & Keusahawanan Digital',
    menteeId: 'mentee-1',
    menteeName: 'Siti Aminah binti Yusof',
    menteePhone: '60112345678',
    businessName: 'Sambal Tok Abah Original',
    businessCategory: 'Makanan & Minuman (F&B)',
    district: 'Kota Bharu',
    recommendedAmount: 'RM3,000',
    grantProgramTitle: 'Dana Benih Usahawan Belia Kelantan (RM3,000)',
    justification: 'Usahawan menunjukkan komitmen tinggi dengan rekod jualan tunai konsisten melebihi RM4,200 sebulan. Penggunaan mesin retort pembungkusan akan melipatgandakan jangka hayat sambal dan sedia dipasarkan di Kapsul Niaga KB Sentral.',
    businessReadinessRemark: 'Telah menghadiri 3 sesi bimbingan penuh dan mematuhi piawaian pembungkusan label produk UMK CEED.',
    issuedAt: '2026-03-28',
    status: 'active'
  },
  {
    id: 'end-2',
    endorsementCode: 'PERAKUAN-UMK-2026-9043',
    mentorId: 'mentor-1',
    mentorName: 'Prof. Madya Dr. Nik Maheran',
    mentorAgency: 'UMK Institut Keusahawanan (UMK CEED)',
    mentorDesignation: 'Mentor Pemasaran Strategik & Keusahawanan Digital',
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
    mentorDesignation: 'Mentor Pemasaran Strategik & Keusahawanan Digital',
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
  activeSubTab = 'overview',
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
      businessReadinessRemark: newEndorsementReadiness || 'Telah dinilai secara profesional dalam sesi bimbingan mentor UMK.',
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
      <div className="py-8 px-2 sm:px-4 w-full animate-in fade-in duration-300">
        <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="max-w-xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              Akses Eksklusif Peranan Mentor
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tight">
              Pusat Pengurusan Mentor Bertauliah
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Bahagian ini dikhaskan untuk <strong>Mentor Bertauliah (UMK, INSKEN & SME Corp)</strong> sahaja bagi menguruskan sesi bimbingan, mengeluarkan <strong>Surat Perakuan Rasmi Geran Belia</strong>, dan mencatat log jurnal tindakan. Modul ini diasingkan sepenuhnya daripada fungsi usahawan mahupun pentadbir sistem demi memelihara integriti bimbingan.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => openLoginModal('mentor')}
              className="w-full sm:w-auto px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <GraduationCap className="w-4 h-4 text-sky-100" />
              <span>Log Masuk Sebagai Mentor</span>
            </button>

            {onBackToHome && (
              <button
                type="button"
                onClick={onBackToHome}
                className="w-full sm:w-auto px-6 py-3 bg-slate-50 hover:bg-sky-50 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
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
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-500 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-100" />
          <span className="text-xs font-semibold">{isSuccessToast}</span>
          <button onClick={() => setIsSuccessToast(null)} className="text-white/80 hover:text-white ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. MENTOR PORTAL HERO BANNER WITH UMK & KBELIA BRANDING */}
      <div className="kbelia-important-header dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200 dark:border-slate-700 relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              Kuasa Eksklusif Bimbingan & Perakuan Geran
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Pusat Bimbingan Usahawan Belia Universiti Malaysia Kelantan (UMK)
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-2.5 flex-wrap">
            <span>Selamat Kembali,</span> 
            <span className="text-sky-700 dark:text-sky-400">{currentMentor.name}</span>
          </h1>
          
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
            {currentMentor.title} &middot; <span className="text-sky-700 dark:text-sky-400 font-semibold">{currentMentor.agency}</span>
          </p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300 pt-1">
            <span className="flex items-center gap-1.5 bg-white/90 dark:bg-slate-900/60 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <Phone className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>+{currentMentor.phone}</span>
            </span>
            <span className="flex items-center gap-1.5 bg-white/90 dark:bg-slate-900/60 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <Clock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>{currentMentor.availableDays}</span>
            </span>
            <span className="flex items-center gap-1.5 bg-white/90 dark:bg-slate-900/60 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <Mail className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>{currentMentor.email}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. METRIC CARDS (4 EXECUTIVE COUNTERS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Metric 1: Total Mentees */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Jumlah Usahawan Mentee
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tabular-nums tracking-tight">
            {totalMentees}
          </div>
          <span className="text-[11px] text-sky-700 dark:text-sky-400 block mt-1 font-semibold">
            {pendingCount} Menunggu Tindakan
          </span>
        </div>

        {/* Metric 2: Active / Confirmed Sessions */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Sesi Bimbingan Disahkan
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-sky-700 dark:text-sky-400 tabular-nums tracking-tight">
            {confirmedCount}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
            Kampus & Google Meet Maya
          </span>
        </div>

        {/* Metric 3: Official Grant Endorsements */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-amber-900/50 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
              Perakuan Geran Dikeluarkan
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 flex items-center justify-center">
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
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Minit & Log Tindakan
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-sky-700 dark:text-sky-400 tabular-nums tracking-tight">
            {totalLogbookCount}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
            Garis Masa Pelan Mentee
          </span>
        </div>

      </div>

      {/* ===================================================================== */}
      {/* TAB 0: RINGKASAN EKSEKUTIF (EXECUTIVE COMMAND CENTER)                */}
      {/* ===================================================================== */}
      {currentSubTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* A. Status Ringkas & Tarikh Operasi */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-white">
                  Pusat Kawalan & Pemantauan Usahawan Belia
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {currentMentor.agency} &middot; Kelantan
                </p>
              </div>
            </div>
          </div>

          {/* B. 4 Bento KPI Metric Counters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Usahawan Dipantau</span>
                <Users className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="text-2xl font-black text-slate-800 dark:text-white tabular-nums tracking-tight">
                {totalMentees}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {mentorRegistrations.filter(r => r.status === 'confirmed').length} sesi aktif disahkan
              </p>
            </div>

            {/* Metric 2 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tindakan Perlu</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums tracking-tight">
                {pendingCount}
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 font-semibold">
                {pendingCount > 0 ? 'Permohonan bimbingan menunggu' : 'Semua permohonan selesai'}
              </p>
            </div>

            {/* Metric 3 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Perakuan Geran</span>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-slate-800 dark:text-white tabular-nums tracking-tight">
                {totalEndorsementsCount}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Surat rasmi ditandatangani
              </p>
            </div>

            {/* Metric 4 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Log & KPI Mentee</span>
                <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="text-2xl font-black text-slate-800 dark:text-white tabular-nums tracking-tight">
                {totalLogbookCount}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Minit & tindakan disemak
              </p>
            </div>
          </div>

          {/* C. 2-Column Command Hub: Temujanji Terdekat & Status Geran */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Lajur 1: Temujanji Terdekat & Tindakan Segera */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                      Temujanji Terdekat & Tindakan
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 px-2 py-0.5 rounded">
                    {mentorRegistrations.slice(0, 3).length} Sesi Terkini
                  </span>
                </div>

                <div className="space-y-3">
                  {mentorRegistrations.slice(0, 3).map((reg) => (
                    <div 
                      key={reg.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 dark:text-white truncate">
                            {reg.entrepreneurName}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                            reg.status === 'confirmed'
                              ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                              : reg.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {reg.status === 'confirmed' ? 'Disahkan' : reg.status === 'completed' ? 'Selesai' : 'Menunggu'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {reg.businessName} &middot; <span className="font-medium text-slate-700 dark:text-slate-300">{reg.district}</span>
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{reg.preferredDate || 'Akan ditetapkan'} &middot; {reg.preferredTime || '10:00 AM'}</span>
                          <span>&middot;</span>
                          <span>{reg.mode === 'online' ? 'Google Meet Maya' : 'Bersemuka Kampus'}</span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {reg.status === 'pending' ? (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(reg, 'confirmed')}
                            className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                          >
                            Sahkan Sesi
                          </button>
                        ) : reg.meetingLink ? (
                          <a
                            href={reg.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold transition-all inline-flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
                          >
                            <Video className="w-3 h-3" />
                            <span>Bilik Maya</span>
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSubTabChange('sessions')}
                            className="px-3 py-1.5 rounded-lg bg-white hover:bg-sky-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap"
                          >
                            Butiran
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {mentorRegistrations.length === 0 && (
                    <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                      Tiada temujanji aktif buat masa ini.
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 mt-4 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Semak jadual lengkap & pengurusan mentee
                </span>
                <button
                  type="button"
                  onClick={() => handleSubTabChange('sessions')}
                  className="text-xs font-bold text-sky-700 dark:text-sky-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Buka Sesi Bimbingan</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Lajur 2: Status Perakuan Geran & Dana Benih */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                      Status Perakuan Geran Usahawan
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded">
                    {endorsements.length} Diluluskan
                  </span>
                </div>

                <div className="space-y-3">
                  {endorsements.slice(0, 3).map((end) => (
                    <div 
                      key={end.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-amber-950/20 border border-slate-200 dark:border-amber-900/40 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 dark:text-white truncate">
                            {end.menteeName}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded">
                            {end.recommendedAmount}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                          {end.businessName} &middot; <span className="text-slate-500 dark:text-slate-400">{end.district}</span>
                        </p>
                        <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 pt-0.5">
                          Kod: {end.endorsementCode} &middot; Tarikh: {end.issuedAt}
                        </p>
                      </div>

                      <div className="shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEndorsementForView(end);
                            handleSubTabChange('endorsements');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                        >
                          Lihat Surat
                        </button>
                      </div>
                    </div>
                  ))}

                  {endorsements.length === 0 && (
                    <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                      Belum ada surat perakuan geran dikeluarkan.
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 mt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsNewEndorsementModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Keluarkan Perakuan Baharu</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSubTabChange('endorsements')}
                  className="text-xs font-bold text-sky-700 dark:text-sky-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Senarai Lengkap</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

          {/* D. Jadual Data Padat Usahawan Mentee (High-Density Executive Table) */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                  Direktori Ringkas Usahawan Mentee
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Senarai usahawan belia di bawah pemantauan {currentMentor.name}
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari usahawan, jajahan..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4">Usahawan & Perniagaan</th>
                    <th className="py-3 px-4">Jajahan</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Status Sesi</th>
                    <th className="py-3 px-4">Status Geran</th>
                    <th className="py-3 px-4 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredRegistrations.map((mentee) => {
                    const hasEndorsement = endorsements.some(e => e.menteeName.toLowerCase() === mentee.entrepreneurName.toLowerCase());
                    return (
                      <tr 
                        key={mentee.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800 dark:text-white">{mentee.entrepreneurName}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{mentee.businessName}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium">
                          {mentee.district}
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                          {mentee.topic}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                            mentee.status === 'confirmed'
                              ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                              : mentee.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {mentee.status === 'confirmed' ? 'Disahkan' : mentee.status === 'completed' ? 'Selesai' : 'Menunggu'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {hasEndorsement ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                              <Award className="w-3.5 h-3.5" />
                              <span>Diperaku</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              Belum
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleSubTabChange('sessions')}
                            className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-sky-50 dark:bg-slate-900 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap"
                          >
                            Buka Sesi
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredRegistrations.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                        Tiada rekod usahawan mentee dijumpai.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 1: SESI BIMBINGAN (LAYOUT KEBAWAH PENUH & MESRA BACAAN MESEJ)     */}
      {/* ===================================================================== */}
      {currentSubTab === 'sessions' && (
        <div className="flex flex-col space-y-8 animate-in fade-in duration-200">
          
          {/* =================================================================== */}
          {/* SEKSYEN 1: PERMOHONAN BIMBINGAN (FULL-WIDTH STACKED CARD)           */}
          {/* =================================================================== */}
          <section id="mentor-applications-section" className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 shadow-2xs space-y-5 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white tracking-tight">
                    Permohonan Bimbingan
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Senarai permohonan bimbingan usahawan belia dengan mesej cabaran, perincian bisnes dan tindakan bimbingan segera.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  {filteredRegistrations.length} Usahawan
                </span>
              </div>
            </div>

            {/* Quick Search & Filter Controls Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama usahawan, jenama perniagaan atau topik bimbingan..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                />
              </div>

              {/* Status Tabs Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {(['all', 'pending', 'confirmed', 'completed'] as const).map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setStatusFilter(tab)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                      statusFilter === tab
                        ? 'bg-sky-600 text-white shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {tab === 'all' ? `Semua (${mentorRegistrations.length})` : tab === 'pending' ? `Menunggu (${pendingCount})` : tab === 'confirmed' ? `Disahkan (${confirmedCount})` : `Selesai (${completedCount})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Mentee Applications Full-Width Stacked Cards */}
            <div className="space-y-4 pt-1">
              {filteredRegistrations.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900/40">
                  <GraduationCap className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Tiada rekod padanan permohonan bimbingan.</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Cuba tukar kata kunci carian atau pilih tab status lain di atas.</p>
                </div>
              ) : (
                filteredRegistrations.map(mentee => {
                  const isPending = mentee.status === 'pending';
                  const isConfirmed = mentee.status === 'confirmed';
                  const isCompleted = mentee.status === 'completed';

                  const rawPhone = mentee.entrepreneurPhone || (mentee as any).phone || '';
                  const cleanPhone = typeof rawPhone === 'string' ? rawPhone.replace(/[^0-9]/g, '') : '';

                  return (
                    <div
                      key={mentee.id}
                      className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:border-sky-300 dark:hover:border-sky-700 transition-all space-y-4 shadow-2xs"
                    >
                      {/* Top Row: Mentee Info & Status Badge */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
                              {mentee.entrepreneurName}
                            </h4>
                            <span className="text-xs font-semibold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-0.5 rounded-md border border-sky-200 dark:border-sky-800">
                              {mentee.businessName}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                            <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                              <MapPin className="w-3.5 h-3.5 text-sky-600" />
                              <span>{mentee.district || 'Kelantan'}</span>
                            </span>
                            <span>&middot;</span>
                            <span>Kategori: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{mentee.businessCategory || 'Perniagaan Belia'}</strong></span>
                            <span>&middot;</span>
                            <span>Fokus Bimbingan: <strong className="text-sky-700 dark:text-sky-400 font-semibold">{mentee.topic}</strong></span>
                            {mentee.preferredDate && (
                              <>
                                <span>&middot;</span>
                                <span className="flex items-center gap-1 text-sky-700 dark:text-sky-400 font-medium">
                                  <Clock className="w-3 h-3" />
                                  <span>Cadangan: {mentee.preferredDate} ({mentee.preferredTime || '10:00 AM'})</span>
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Status Label */}
                        <div className="shrink-0 self-start">
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-lg ${
                            isCompleted
                              ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : isConfirmed
                              ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                              : isPending
                              ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              : 'bg-rose-50 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          }`}>
                            {isCompleted ? 'Selesai Dibimbing' : isConfirmed ? 'Sesi Disahkan' : isPending ? 'Menunggu Tindakan' : 'Dibatalkan'}
                          </span>
                        </div>
                      </div>

                      {/* Prominent Mentee Message & Challenges Box (Generous space & large readable font) */}
                      <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                          <MessageSquare className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                          <span>Mesej Permohonan & Cabaran Dihadapi Usahawan:</span>
                        </div>
                        <p className="text-sm sm:text-base leading-relaxed text-slate-800 dark:text-slate-100 font-normal whitespace-pre-line">
                          {mentee.challenges ? (
                            `"${mentee.challenges}"`
                          ) : (
                            <span className="italic text-slate-500 dark:text-slate-400">
                              "Usahawan memohon sesi bimbingan khusus bagi strategi pemasaran, pengurusan kos operasi, dan persediaan dokumentasi permohonan geran belia UMK."
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Existing Mentor Action Plan Preview if any */}
                      {mentee.mentorActionPlan && (
                        <div className="p-3.5 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 space-y-1">
                          <div className="flex items-center justify-between text-xs font-bold text-sky-800 dark:text-sky-300">
                            <span className="flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                              <span>Pelan Tindakan Mentor Tersimpan:</span>
                            </span>
                            <span className="text-[11px] font-normal text-sky-700 dark:text-sky-400">Telah dihantar</span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                            {mentee.mentorActionPlan}
                          </p>
                        </div>
                      )}

                      {/* Action Buttons Row */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                        {/* Left: Contact */}
                        <div className="flex items-center gap-2">
                          <a
                            href={cleanPhone ? `https://wa.me/${cleanPhone}?text=Salam%20${encodeURIComponent(mentee.entrepreneurName)}%2C%20saya%20mentor%20anda%20dari%20KBelia%20UMK.` : '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>WhatsApp Usahawan</span>
                          </a>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                          {isPending && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(mentee, 'confirmed')}
                              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Sahkan Sesi Bimbingan</span>
                            </button>
                          )}

                          {isConfirmed && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(mentee, 'completed')}
                              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Tandakan Selesai Sesi</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenNotesModal(mentee)}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold text-sky-700 dark:text-sky-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>{mentee.mentorActionPlan ? 'Kemaskini Pelan Tindakan' : '+ Sediakan Pelan Tindakan'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setNewEndorsementMenteeName(mentee.entrepreneurName);
                              setNewEndorsementBusinessName(mentee.businessName);
                              setNewEndorsementDistrict(mentee.district);
                              setIsNewEndorsementModalOpen(true);
                            }}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>Perakuan Geran</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* =================================================================== */}
          {/* SEKSYEN 2: JADUAL (FULL-WIDTH STACKED CARD)                         */}
          {/* =================================================================== */}
          <section id="mentor-schedule-section" className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 shadow-2xs space-y-5 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white tracking-tight">
                    Jadual
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Takwim sesi temujanji aktif bersemuka di bilik bimbingan UMK serta sesi Google Meet maya.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsNewSlotModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>+ Slot Baharu</span>
              </button>
            </div>

            {/* Confirmed Sessions List */}
            <div className="space-y-4">
              {mentorRegistrations.filter(m => m.status === 'confirmed').length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900/40">
                  <Clock className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Tiada sesi bimbingan aktif ditetapkan dalam jadual.</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Sahkan permohonan bimbingan di bahagian atas untuk menjadualkan tarikh dan slot.</p>
                </div>
              ) : (
                mentorRegistrations.filter(m => m.status === 'confirmed').map((mentee) => {
                  const rawPhone = mentee.entrepreneurPhone || (mentee as any).phone || '';
                  const cleanPhone = typeof rawPhone === 'string' ? rawPhone.replace(/[^0-9]/g, '') : '';

                  return (
                    <div
                      key={mentee.id}
                      className="p-5 sm:p-6 rounded-2xl border border-sky-200 dark:border-sky-800/60 bg-sky-50/40 dark:bg-sky-950/20 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-sky-800 dark:text-sky-300 bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 px-3 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                            <span>{mentee.preferredDate || 'Akan Ditetapkan'} &middot; {mentee.preferredTime || '10:00 AM'}</span>
                          </span>
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                            Sesi Disahkan
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {mentee.meetingLink ? (
                            <a
                              href={mentee.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 transition-colors shadow-xs"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>Sertai Google Meet</span>
                              <ExternalLink className="w-3 h-3 ml-0.5" />
                            </a>
                          ) : (
                            <span className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-medium">
                              <MapPin className="w-3.5 h-3.5 text-sky-600" />
                              <span>Bilik Bimbingan UMK CEED</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-base font-bold text-slate-800 dark:text-white">
                          {mentee.entrepreneurName} &middot; <span className="text-sky-700 dark:text-sky-400">{mentee.businessName}</span>
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          Topik Perbincangan: <strong className="text-slate-800 dark:text-white font-semibold">{mentee.topic}</strong> &middot; Daerah: {mentee.district || 'Kelantan'}
                        </p>
                        {mentee.challenges && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 pt-1 line-clamp-1 italic">
                            Nota usahawan: "{mentee.challenges}"
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-sky-200/60 dark:border-sky-800/40">
                        {cleanPhone ? (
                          <a
                            href={`https://wa.me/${cleanPhone}?text=Salam%20${encodeURIComponent(mentee.entrepreneurName)}%2C%20peringatan%20sesi%20bimbingan%20kita%20pada%20${encodeURIComponent(mentee.preferredDate || 'tarikh dijadualkan')}.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-emerald-700 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Hantar Peringatan WhatsApp</span>
                          </a>
                        ) : <span />}

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenNotesModal(mentee)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-700 dark:text-sky-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          >
                            Nota / Pelan Tindakan
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(mentee, 'completed')}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Selesai Sesi</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* =================================================================== */}
          {/* SEKSYEN 3: PELAN TINDAKAN (FULL-WIDTH STACKED CARD)                 */}
          {/* =================================================================== */}
          <section id="mentor-action-plans-section" className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 shadow-2xs space-y-5 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white tracking-tight">
                    Pelan Tindakan
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Garis panduan bimbingan, sasaran KPI jualan dan langkah penambahbaikan berstruktur untuk usahawan belia.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  {mentorRegistrations.filter(m => m.mentorActionPlan).length} Pelan Disediakan
                </span>
              </div>
            </div>

            {/* Action Plans Feed in Full Width */}
            <div className="space-y-4">
              {mentorRegistrations.filter(m => m.mentorActionPlan).length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900/40 space-y-2">
                  <MessageSquare className="w-10 h-10 text-slate-400 mx-auto opacity-50" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Belum ada nota pelan tindakan.</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Tekan "+ Sediakan Pelan Tindakan" pada senarai permohonan bimbingan di atas untuk menetapkan hala tuju bisnes usahawan.</p>
                </div>
              ) : (
                mentorRegistrations.filter(m => m.mentorActionPlan).map((mentee) => (
                  <div
                    key={mentee.id}
                    className="p-5 sm:p-6 rounded-2xl border border-sky-200 dark:border-sky-800/60 bg-sky-50/40 dark:bg-sky-950/20 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="text-base font-bold text-slate-800 dark:text-white">
                          {mentee.entrepreneurName} &middot; <span className="text-sky-700 dark:text-sky-400">{mentee.businessName}</span>
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Topik: <span className="font-semibold text-slate-700 dark:text-slate-300">{mentee.topic}</span> &middot; Daerah: {mentee.district || 'Kelantan'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenNotesModal(mentee)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-sky-800 dark:text-sky-300 bg-sky-100 dark:bg-sky-900/50 hover:bg-sky-200 dark:hover:bg-sky-900/80 transition-colors cursor-pointer self-start sm:self-auto"
                      >
                        Kemaskini Pelan Tindakan
                      </button>
                    </div>

                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900/70 border border-sky-200/80 dark:border-sky-900/50 space-y-1.5">
                      <span className="text-xs font-bold text-sky-800 dark:text-sky-300 block">
                        Garis Panduan & Sasaran Tindakan Mentor:
                      </span>
                      <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed font-sans">
                        {mentee.mentorActionPlan}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                      <span>Penyeliaan berterusan di bawah inisiatif keusahawanan UMK CEED</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Tersimpan & Sah</span>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: PERAKUAN RASMI GERAN BELIA (OFFICIAL GRANT ENDORSEMENT)       */}
      {/* ===================================================================== */}
      {currentSubTab === 'endorsements' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Header Action Banner */}
          <div className="p-5 kbelia-important-header dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <h3 className="text-base font-bold text-slate-800 dark:text-white">
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
              className="interactive-press interactive-lift px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Keluarkan Surat Perakuan Baharu</span>
            </button>
          </div>

          {/* List of Issued Endorsements */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">
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
                  className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-4 space-y-3 hover:border-sky-300 dark:hover:border-sky-600 transition-all shadow-2xs flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-800 px-2 py-0.5 rounded">
                        {item.endorsementCode}
                      </span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>Disahkan Rasmi</span>
                      </span>
                    </div>

                    <div>
                      <h5 className="text-xs font-bold text-slate-800 dark:text-white">
                        {item.menteeName}
                      </h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {item.businessName} &middot; <span className="font-medium text-slate-700 dark:text-slate-300">{item.district}</span>
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40 space-y-1">
                      <div className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300">
                        {item.grantProgramTitle}
                      </div>
                      <div className="text-base font-black text-amber-700 dark:text-amber-400">
                        {item.recommendedAmount}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed italic bg-white dark:bg-slate-900/70 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                      "{item.justification}"
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Tarikh: {item.issuedAt}
                    </span>

                    <button
                      type="button"
                      onClick={() => setSelectedEndorsementForView(item)}
                      className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
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
          
          <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
                <h3 className="text-base font-bold text-slate-800 dark:text-white">
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
              className="interactive-press interactive-lift px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Catat Log Jurnal Baharu</span>
            </button>
          </div>

          <div className="space-y-4">
            {logEntries.map((log) => (
              <div
                key={log.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-2xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-[10px] font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider block">
                      Tarikh Sesi: {log.sessionDate}
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">
                      {log.menteeName} &middot; <span className="text-sky-700 dark:text-sky-400">{log.businessName}</span>
                    </h4>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 w-fit">
                    Topik: {log.topic}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Ringkasan Minit Bimbingan Mentor:
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/70 p-3 rounded-xl border border-slate-200 dark:border-slate-700 leading-relaxed font-sans">
                    {log.minutes}
                  </p>
                </div>

                {log.actionItems && log.actionItems.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Senarai Semak Tugasan Wajib Mentee:</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">Tekan kotak untuk tandakan status selesai</span>
                    </div>

                    <div className="space-y-2">
                      {log.actionItems.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => handleToggleLogTask(log.id, task.id)}
                          className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                            task.completed
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-slate-500 dark:text-slate-400 line-through'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-700 text-slate-800 dark:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                              task.completed
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800'
                            }`}>
                              {task.completed && <Check className="w-3.5 h-3.5" />}
                            </div>
                            <span className="text-xs font-medium">{task.task}</span>
                          </div>

                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                            task.completed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
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
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-2xs space-y-6 animate-in fade-in duration-200">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                Profil & Kredensial Mentor Bertauliah
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Maklumat ini dipaparkan kepada usahawan belia yang ingin memohon bimbingan perniagaan.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsEditProfileOpen(true)}
              className="interactive-press interactive-lift px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Sunting Maklumat Profil</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Nama Penuh & Gelaran:
                </label>
                <div className="text-sm font-bold text-slate-800 dark:text-white p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  {currentMentor.name}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Jawatan & Agensi:
                </label>
                <div className="text-sm font-medium text-slate-800 dark:text-white p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  {currentMentor.title} &middot; <span className="font-bold text-sky-700 dark:text-sky-400">{currentMentor.agency}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Saluran Perhubungan Rasmi:
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <Phone className="w-4 h-4 text-sky-600" />
                    <span>WhatsApp: +{currentMentor.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <Mail className="w-4 h-4 text-sky-600" />
                    <span>Emel Rasmi: {currentMentor.email}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Waktu & Hari Kelapangan Bimbingan:
                </label>
                <div className="text-sm font-bold text-slate-800 dark:text-white p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>{currentMentor.availableDays}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Bidang Pengkhususan Bimbingan:
                </label>
                <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  {currentMentor.expertise.map((exp, idx) => (
                    <span key={idx} className="text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800 px-3 py-1 rounded-lg">
                      {exp}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Biodata Ringkas Mentor:
                </label>
                <p className="text-xs text-slate-600 dark:text-slate-300 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 leading-relaxed font-sans">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[92vh] overflow-y-auto overflow-hidden">
            
            <div className="kbelia-important-header px-6 sm:px-7 pt-6 pb-4 flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800 flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800 dark:text-white">
                    Borang Perakuan Rasmi Geran Belia
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Universiti Malaysia Kelantan &bull; Hab Usahawan Belia KBelia
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewEndorsementModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/80 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGrantEndorsement} className="px-6 sm:px-7 pb-6 sm:pb-7 pt-4 space-y-3.5">
              
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
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
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
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
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
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
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
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
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
                        ? 'bg-sky-50 text-sky-900 border-sky-500 font-bold dark:bg-sky-950/70 dark:text-sky-300'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-sky-300'
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
                        ? 'bg-sky-50 text-sky-900 border-sky-500 font-bold dark:bg-sky-950/70 dark:text-sky-300'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-sky-300'
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
                        ? 'bg-sky-50 text-sky-900 border-sky-500 font-bold dark:bg-sky-950/70 dark:text-sky-300'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-sky-300'
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
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 leading-relaxed font-sans"
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
                  placeholder="Cth: Telah lulus 3 sesi bimbingan mentor & mematuhi piawaian pembungkusan UMK"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div className="p-3 bg-sky-50/70 dark:bg-sky-950/30 rounded-xl border border-sky-200 dark:border-sky-800">
                <label className="flex items-start gap-2.5 text-xs text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEndorsementConfirmed}
                    onChange={(e) => setIsEndorsementConfirmed(e.target.checked)}
                    className="mt-0.5 rounded text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="leading-relaxed">
                    Saya dengan ini memperakui bahawa saya telah menyemak dokumen perniagaan dan membimbing usahawan belia ini. Perakuan ini dibuat dengan penuh integriti bagi kegunaan urus setia kerajaan.
                  </span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewEndorsementModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-sm flex items-center gap-1.5 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[94vh] overflow-y-auto space-y-6">
            
            {/* Action Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-bold text-sky-800 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-600" />
                Dokumen Rasmi Sokongan Geran Belia
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-sky-50 text-slate-800 border border-slate-200 hover:border-sky-300 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedEndorsementForView(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Letterhead */}
            <div className="text-center space-y-1 pb-4 border-b-2 border-slate-900">
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-black text-sm">
                  UMK
                </div>
                <div className="text-left">
                  <h3 className="font-black text-base tracking-tight text-slate-900 uppercase">
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
                <strong className="text-emerald-900">{selectedEndorsementForView.endorsementCode}</strong>
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
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
              <h4 className="font-bold text-sm text-emerald-950 uppercase">
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
                <div><strong>Nilai Bantuan Diperakukan:</strong> <span className="font-bold text-emerald-800">{selectedEndorsementForView.recommendedAmount}</span></div>
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
                  <span className="font-serif italic text-emerald-900 font-bold text-sm">N.Maheran</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[92vh] overflow-y-auto overflow-hidden">
            
            <div className="kbelia-important-header px-6 sm:px-7 pt-6 pb-4 flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 dark:bg-sky-950/80 dark:border-sky-800 text-sky-600 dark:text-sky-300 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800 dark:text-white">
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
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/80 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLogEntry} className="px-6 sm:px-7 pb-6 sm:pb-7 pt-4 space-y-3.5">
              
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
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
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
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
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
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
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
                  placeholder="Catatkan nasihat mentor, isu aliran tunai atau penemuan bimbingan..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-sans leading-relaxed focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tugasan Wajib Usahawan (Action Checklist):
                </label>
                
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newLogTask1}
                    onChange={(e) => setNewLogTask1(e.target.value)}
                    placeholder="Tugasan 1 (Cth: Buka akaun bank)"
                    className="col-span-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                  <input
                    type="text"
                    value={newLogDueDate1}
                    onChange={(e) => setNewLogDueDate1(e.target.value)}
                    placeholder="Tarikh sasaran"
                    className="px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newLogTask2}
                    onChange={(e) => setNewLogTask2(e.target.value)}
                    placeholder="Tugasan 2 (Cth: Hantar borang SSM)"
                    className="col-span-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                  <input
                    type="text"
                    value={newLogDueDate2}
                    onChange={(e) => setNewLogDueDate2(e.target.value)}
                    placeholder="Tarikh sasaran"
                    className="px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewLogModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-sm cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[92vh] overflow-y-auto overflow-hidden">
            
            <div className="kbelia-important-header px-6 sm:px-7 pt-6 pb-4 flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 dark:bg-sky-950/80 dark:border-sky-800 text-sky-600 dark:text-sky-300 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800 dark:text-white">
                    Nota Nasihat & Pelan Tindakan Usahawan
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Untuk: <span className="font-bold text-sky-700 dark:text-sky-300">{selectedMenteeForNotes.entrepreneurName}</span> ({selectedMenteeForNotes.businessName})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMenteeForNotes(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/80 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNotes} className="px-6 sm:px-7 pb-6 sm:pb-7 pt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Pelan Tindakan Usahawan (Action Items / Checklist):
                </label>
                <textarea
                  rows={4}
                  value={actionPlanInput}
                  onChange={(e) => setActionPlanInput(e.target.value)}
                  placeholder="Contoh:&#10;1. Sediakan 3 video promosi menu baharu sebelum 28 Mac.&#10;2. Buka akaun perniagaan khusus untuk elak campur duit peribadi.&#10;3. Hadiri bengkel pengurusan inventori UMK."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 leading-relaxed font-sans"
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
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
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
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMenteeForNotes(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-sm flex items-center gap-1.5 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="kbelia-important-header px-6 pt-5 pb-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-sm text-slate-800 dark:text-white">
                Buka Slot Jadual Bimbingan Baharu
              </h3>
              <button onClick={() => setIsNewSlotModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tarikh Sesi:
                </label>
                <input
                  type="text"
                  value={newSlotDate}
                  onChange={(e) => setNewSlotDate(e.target.value)}
                  placeholder="Cth: 12 April 2026 (Ahad)"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
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
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Mod Bimbingan:
                </label>
                <select
                  value={newSlotMode}
                  onChange={(e) => setNewSlotMode(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                >
                  <option value="Bersemuka di Kampus">Bersemuka di Kampus (Bilik Bimbingan UMK)</option>
                  <option value="Google Meet Maya">Google Meet Maya</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewSlotModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsNewSlotModalOpen(false);
                    showToast('Slot bimbingan baharu berjaya diterbitkan untuk usahawan belia!');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-sm cursor-pointer"
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
