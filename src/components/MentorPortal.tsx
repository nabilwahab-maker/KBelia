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
  FileCheck,
  BarChart3,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  MentorProfile, 
  MentorshipRegistration, 
  KelantanDistrict, 
  MentorSubTab, 
  GrantEndorsementLetter, 
  MentoringLogEntry,
  BusinessListing
} from '../types';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { isProductionAuthenticated, saveGrantEndorsementRecord, saveMentoringLogRecord } from '../services/dataService';
import {
  mergeUniqueById,
  subscribeCrossTabSync,
  subscribeDemoSyncCollection
} from '../services/realtimeSync';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { MentorProfileEditModal } from './MentorProfileEditModal';
import { emitAdminOrMentorNotification } from '../services/notificationStore';
import { showToast as triggerToast } from './ToastNotification';
import { SaaSKpiCard } from './SaaSKpiCard';
import { PortalImage } from './PortalImage';
import { PaginationBar, usePagination } from './PaginationBar';
import { resolveMenteeVisuals } from '../utils/visualAssets';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface MentorPortalProps {
  mentors: MentorProfile[];
  registrations: MentorshipRegistration[];
  businesses?: BusinessListing[];
  onUpdateRegistration: (updated: MentorshipRegistration) => void;
  onUpdateMentor?: (updatedMentor: MentorProfile) => void;
  activeSubTab?: MentorSubTab;
  onSelectSubTab?: (subTab: MentorSubTab) => void;
}

const INITIAL_ENDORSEMENTS: GrantEndorsementLetter[] = [
  {
    id: 'end-1',
    endorsementCode: 'PERAKUAN-UMK-2026-8812',
    mentorId: 'mentor-1',
    mentorName: 'Prof. Madya Dr. Wan Azhar',
    mentorAgency: 'Universiti Malaysia Kelantan (UMK)',
    mentorDesignation: 'Pengarah Institut Keusahawanan Universiti Malaysia Kelantan (UMK)',
    menteeId: 'mentee-1',
    menteeName: 'Siti Aminah binti Yusof',
    menteePhone: '60112345678',
    businessName: 'Sambal Tok Abah Original',
    businessCategory: 'Makanan & Minuman (F&B)',
    district: 'Kota Bharu',
    recommendedAmount: 'RM3,000',
    grantProgramTitle: 'Geran Permulaan Usahawan Belia Kelantan (RM3,000)',
    justification: 'Usahawan menunjukkan komitmen tinggi dengan rekod jualan tunai konsisten melebihi RM4,200 sebulan. Penggunaan mesin retort pembungkusan akan memanjangkan jangka hayat sambal dan sedia dipasarkan di Kiosk Belia KB Sentral.',
    businessReadinessRemark: 'Telah menghadiri 3 sesi bimbingan penuh dan mematuhi piawaian pembungkusan label produk UMK CEED.',
    issuedAt: '2026-03-28',
    status: 'active'
  },
  {
    id: 'end-2',
    endorsementCode: 'PERAKUAN-UMK-2026-9043',
    mentorId: 'mentor-1',
    mentorName: 'Prof. Madya Dr. Wan Azhar',
    mentorAgency: 'Universiti Malaysia Kelantan (UMK)',
    mentorDesignation: 'Pengarah Institut Keusahawanan Universiti Malaysia Kelantan (UMK)',
    menteeId: 'mentee-2',
    menteeName: 'Muhammad Farhan bin Zulkifli',
    menteePhone: '60198765432',
    businessName: 'Kelantan Tech Solution',
    businessCategory: 'Teknologi & Servis Digital',
    district: 'Bachok',
    recommendedAmount: 'RM5,000',
    grantProgramTitle: 'Geran Pemangkin Usahawan Belia Kelantan (RM5,000)',
    justification: 'Inovasi sistem POS dan inventori awan yang dibangunkan telah diuji oleh 5 peniaga kapsul niaga UMK dengan maklum balas positif. Geran disyorkan bagi menaik taraf server awan dan perlesenan keselamatan.',
    businessReadinessRemark: 'Model Ruang Niaga yang mampan dengan unjuran pulangan modal dalam tempoh 4 bulan.',
    issuedAt: '2026-04-02',
    status: 'active'
  },
  {
    id: 'end-3',
    endorsementCode: 'PERAKUAN-UMK-2026-7734',
    mentorId: 'mentor-1',
    mentorName: 'Prof. Madya Dr. Wan Azhar',
    mentorAgency: 'Universiti Malaysia Kelantan (UMK)',
    mentorDesignation: 'Pengarah Institut Keusahawanan Universiti Malaysia Kelantan (UMK)',
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
  businesses = [],
  onUpdateRegistration,
  onUpdateMentor,
  activeSubTab = 'overview',
  onSelectSubTab
}) => {
  const { user, userProfile, isMentor, isDemoSession, openLoginModal } = useAuth();
  const { language } = useLanguage();
  const isEn = language === 'en';
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

  // Locked Mentor Identity (bound strictly to userProfile.mentorId)
  const lockedMentorId = userProfile?.mentorId || mentors[0]?.id || 'mentor-1';
  const currentMentor = mentors.find(m => m.id === lockedMentorId) || mentors[0];

  // Endorsements State (Local + Firestore persistent)
  const [endorsements, setEndorsements] = useState<GrantEndorsementLetter[]>(() => {
    try {
      const saved = localStorage.getItem('kbelia_mentor_endorsements_v1') || localStorage.getItem('kbelia_mentor_grant_endorsements');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_ENDORSEMENTS;
  });

  const saveEndorsements = (updated: GrantEndorsementLetter[]) => {
    setEndorsements(updated);
    try {
      localStorage.setItem('kbelia_mentor_endorsements_v1', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Logbook State (Local + Firestore persistent)
  const [logEntries, setLogEntries] = useState<MentoringLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('kbelia_mentor_logs_v1') || localStorage.getItem('kbelia_mentor_action_logbook');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_LOGS;
  });

  const saveLogEntries = (updated: MentoringLogEntry[]) => {
    setLogEntries(updated);
    try {
      localStorage.setItem('kbelia_mentor_logs_v1', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Real-time Firestore + DemoSync + Cross-Tab sync scoped strictly to currentMentor.id
  useEffect(() => {
    if (!user || !isMentor || !currentMentor?.id) return;

    const prodAuth = isProductionAuthenticated();
    const readLocalList = <T,>(key: string, fallback: T[]): T[] => {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {
        // ignore
      }
      return fallback;
    };

    let prodEndorsements: GrantEndorsementLetter[] = [];
    let demoSyncEndorsements: GrantEndorsementLetter[] = [];
    let prodLogs: MentoringLogEntry[] = [];
    let demoSyncLogs: MentoringLogEntry[] = [];

    const recomputeMentorData = () => {
      const localEnds = readLocalList<GrantEndorsementLetter>('kbelia_mentor_endorsements_v1', INITIAL_ENDORSEMENTS);
      const localLogs = readLocalList<MentoringLogEntry>('kbelia_mentor_logs_v1', INITIAL_LOGS);

      const mergedEnds = prodAuth
        ? mergeUniqueById<GrantEndorsementLetter>([prodEndorsements, demoSyncEndorsements])
        : mergeUniqueById<GrantEndorsementLetter>([demoSyncEndorsements, localEnds, INITIAL_ENDORSEMENTS]);
      mergedEnds.sort((a, b) => (b.issuedAt || '').localeCompare(a.issuedAt || ''));
      setEndorsements(mergedEnds.filter(e => e.mentorId === currentMentor.id));

      const mergedLogs = prodAuth
        ? mergeUniqueById<MentoringLogEntry>([prodLogs, demoSyncLogs])
        : mergeUniqueById<MentoringLogEntry>([demoSyncLogs, localLogs, INITIAL_LOGS]);
      mergedLogs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setLogEntries(mergedLogs.filter(l => l.mentorId === currentMentor.id));
    };

    recomputeMentorData();

    const unsubCrossTab = subscribeCrossTabSync((entity) => {
      if (['all', 'endorsement', 'log'].includes(entity)) {
        recomputeMentorData();
      }
    });

    let unsubEndorsements = () => {};
    let unsubLogs = () => {};

    if (prodAuth && auth.currentUser) {
      unsubEndorsements = onSnapshot(
        query(collection(db, 'mentor_endorsements'), where('mentorId', '==', currentMentor.id)),
        (snap) => {
          prodEndorsements = snap.docs.map(d => ({ id: d.id, ...d.data() } as GrantEndorsementLetter));
          recomputeMentorData();
        },
        (err) => console.warn('Mentor endorsements listener notice:', err)
      );

      unsubLogs = onSnapshot(
        query(collection(db, 'mentor_logs'), where('mentorId', '==', currentMentor.id)),
        (snap) => {
          prodLogs = snap.docs.map(d => ({ id: d.id, ...d.data() } as MentoringLogEntry));
          recomputeMentorData();
        },
        (err) => console.warn('Mentor logs listener notice:', err)
      );
    }

    const unsubDemoEnds = subscribeDemoSyncCollection<GrantEndorsementLetter>('endorsement', (items) => {
      demoSyncEndorsements = items;
      recomputeMentorData();
    });

    const unsubDemoLogs = subscribeDemoSyncCollection<MentoringLogEntry>('log', (items) => {
      demoSyncLogs = items;
      recomputeMentorData();
    });

    return () => {
      unsubCrossTab();
      unsubEndorsements();
      unsubLogs();
      unsubDemoEnds();
      unsubDemoLogs();
    };
  }, [user?.uid, isDemoSession, isMentor, currentMentor?.id]);

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

  // Expandable compact list states
  const [expandedApplicationIds, setExpandedApplicationIds] = useState<Record<string, boolean>>({});
  const [expandedScheduleIds, setExpandedScheduleIds] = useState<Record<string, boolean>>({});
  const [expandedActionPlanIds, setExpandedActionPlanIds] = useState<Record<string, boolean>>({});
  const [expandedLogIds, setExpandedLogIds] = useState<Record<string, boolean>>({});

  // Strictly scoped registrations, endorsements & logs for the authenticated mentor ONLY
  const mentorRegistrations = registrations.filter(r => r.mentorId === currentMentor.id);
  const mentorEndorsements = endorsements.filter(e => e.mentorId === currentMentor.id);
  const mentorLogs = logEntries.filter(l => l.mentorId === currentMentor.id);

  const statusOrderWeight = (status: MentorshipRegistration['status']) => {
    if (status === 'pending') return 0;
    if (status === 'confirmed') return 1;
    if (status === 'completed') return 2;
    return 3;
  };

  // Overview table: matches search across all statuses, sorted active-first
  const overviewRegistrations = mentorRegistrations
    .filter(r => {
      const q = searchQuery.toLowerCase();
      return (
        r.entrepreneurName.toLowerCase().includes(q) ||
        r.businessName.toLowerCase().includes(q) ||
        r.topic.toLowerCase().includes(q) ||
        r.district.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => statusOrderWeight(a.status) - statusOrderWeight(b.status));

  // Permohonan Bimbingan: 'all' tab ONLY shows active (pending + confirmed); 'completed' is separated into 'Selesai' tab
  const filteredRegistrations = mentorRegistrations
    .filter(r => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        r.entrepreneurName.toLowerCase().includes(q) ||
        r.businessName.toLowerCase().includes(q) ||
        r.topic.toLowerCase().includes(q) ||
        r.district.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'all'
          ? r.status === 'pending' || r.status === 'confirmed'
          : r.status === statusFilter;
      const matchesMode = modeFilter === 'all' || r.mode === modeFilter;

      return matchesSearch && matchesStatus && matchesMode;
    })
    .sort((a, b) => statusOrderWeight(a.status) - statusOrderWeight(b.status));

  const confirmedScheduleSessions = mentorRegistrations.filter(m => m.status === 'confirmed');
  const actionPlanMentees = mentorRegistrations.filter(m => Boolean(m.mentorActionPlan));

  // Calculate statistics for this mentor
  const totalMentees = mentorRegistrations.length;
  const activeCount = mentorRegistrations.filter(r => r.status === 'pending' || r.status === 'confirmed').length;
  const pendingCount = mentorRegistrations.filter(r => r.status === 'pending').length;
  const confirmedCount = confirmedScheduleSessions.length;
  const completedCount = mentorRegistrations.filter(r => r.status === 'completed').length;
  const totalEndorsementsCount = mentorEndorsements.length;
  const totalLogbookCount = mentorLogs.length;

  // Unconditional 5-item pagination hooks across MentorPortal lists
  const overviewPagination = usePagination(overviewRegistrations, 5, [searchQuery, currentMentor.id]);
  const applicationsPagination = usePagination(filteredRegistrations, 5, [searchQuery, statusFilter, modeFilter, currentMentor.id]);
  const schedulePagination = usePagination(confirmedScheduleSessions, 5, [currentMentor.id, confirmedScheduleSessions.length]);
  const actionPlansPagination = usePagination(actionPlanMentees, 5, [currentMentor.id, actionPlanMentees.length]);
  const endorsementsPagination = usePagination(mentorEndorsements, 5, [currentMentor.id, mentorEndorsements.length]);
  const logsPagination = usePagination(mentorLogs, 5, [currentMentor.id, mentorLogs.length]);

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
      title: `Nota Bimbingan Mentor: ${selectedMenteeForNotes.entrepreneurName}`,
      message: `${currentMentor.name} telah menghantar nota bimbingan & cadangan tindakan baharu (${selectedMenteeForNotes.topic}).`,
      type: 'mentorship',
      senderRole: 'mentor',
      targetRole: 'youth',
      targetUserId: selectedMenteeForNotes.applicantId,
      sender: currentMentor.name,
      actionTab: 'merchant'
    });
    setSelectedMenteeForNotes(null);
    showToast('Nota bimbingan & cadangan tindakan berjaya dihantar kepada usahawan!');
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
      targetRole: 'youth',
      targetUserId: mentee.applicantId,
      sender: currentMentor.name,
      actionTab: 'merchant'
    });
    showToast(`Status temujanji ${mentee.entrepreneurName} dikemas kini kepada: ${newStatus === 'confirmed' ? 'Disahkan' : newStatus === 'completed' ? 'Selesai' : 'Dibatalkan'}`);
  };

  // Toggle logbook task completion
  const handleToggleLogTask = (logId: string, taskId: string) => {
    let targetUpdatedLog: MentoringLogEntry | null = null;
    const updated = logEntries.map(log => {
      if (log.id !== logId || log.mentorId !== currentMentor.id) return log;
      targetUpdatedLog = {
        ...log,
        actionItems: log.actionItems.map(task => {
          if (task.id !== taskId) return task;
          return { ...task, completed: !task.completed };
        })
      };
      return targetUpdatedLog;
    });
    saveLogEntries(updated);
    if (targetUpdatedLog) {
      void saveMentoringLogRecord(targetUpdatedLog).catch(console.error);
    }
    showToast('Status semakan tugasan usahawan dikemaskini!');
  };

  // Issue New Grant Endorsement
  const handleCreateGrantEndorsement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEndorsementMenteeName || !newEndorsementBusinessName || !newEndorsementJustification) {
      triggerToast('Sila lengkapkan nama usahawan, nama perniagaan dan ulasan justifikasi perakuan.', 'error');
      return;
    }
    if (!isEndorsementConfirmed) {
      triggerToast('Sila tandakan kotak perakuan integriti profesional mentor.', 'warning');
      return;
    }

    const matchedMentee = mentorRegistrations.find(
      r => r.entrepreneurName.toLowerCase() === newEndorsementMenteeName.trim().toLowerCase() ||
           r.businessName.toLowerCase() === newEndorsementBusinessName.trim().toLowerCase()
    );

    const uniqueCode = `PERAKUAN-UMK-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const programTitle = newEndorsementGrantType === 'RM3,000' 
      ? 'Geran Permulaan Usahawan Belia Kelantan (RM3,000)'
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
      menteeId: matchedMentee?.applicantId || `mentee-${Date.now()}`,
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
    void saveGrantEndorsementRecord(newEndorsement).catch(console.error);
    if (matchedMentee?.applicantId) {
      emitAdminOrMentorNotification({
        title: `Perakuan Geran Mentor Dikeluarkan (${newEndorsementGrantType})`,
        message: `${currentMentor.name} telah mengeluarkan Surat Perakuan Rasmi (${uniqueCode}) untuk ${newEndorsementBusinessName}.`,
        type: 'grant',
        senderRole: 'mentor',
        targetRole: 'youth',
        targetUserId: matchedMentee.applicantId,
        sender: currentMentor.name,
        actionTab: 'merchant'
      });
    }
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
      triggerToast('Sila isi nama mentee, bisnes, topik dan minit bimbingan.', 'error');
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
    void saveMentoringLogRecord(newEntry).catch(console.error);
    setIsNewLogModalOpen(false);
    showToast('Rekod sesi bimbingan berjaya disimpan!');

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

  // Security Barrier: Strictly Certified Mentor ONLY (Zero Cross-Portal Access)
  if (!isMentor) {
    return (
      <div className="py-8 px-2 sm:px-4 w-full animate-in fade-in duration-300">
        <div className="bg-white dark:bg-slate-800 text-black dark:text-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-300 dark:border-slate-600 relative overflow-hidden text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800/70 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="max-w-xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/60 text-black dark:text-white border border-rose-200 dark:border-rose-800/70">
              <ShieldCheck className="w-3.5 h-3.5" />
              Akses Eksklusif Peranan Mentor
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-black dark:text-white tracking-tight">
              Portal Pengurusan Mentor
            </h2>
            <p className="text-xs sm:text-sm text-black dark:text-white leading-relaxed">
              Bahagian ini dikhaskan untuk <strong>Mentor Rasmi (UMK, INSKEN & SME Corp)</strong> sahaja bagi menguruskan sesi bimbingan usahawan seliaan sendiri, mengeluarkan <strong>Surat Sokongan Geran Belia</strong>, dan mencatat rekod sesi serta tugasan. Modul ini diasingkan sepenuhnya daripada fungsi usahawan mahupun pentadbir sistem.
            </p>
          </div>

          {/* Action button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => openLoginModal('mentor')}
              className="w-full sm:w-auto px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer dark:bg-teal-600"
            >
              <GraduationCap className="w-4 h-4 text-white" />
              <span>Log Masuk Sebagai Mentor</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-300 pb-2">
      
      {/* Toast Notification */}
      {isSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-500 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className="text-xs font-semibold">{isSuccessToast}</span>
          <button onClick={() => setIsSuccessToast(null)} className="text-white/80 hover:text-white ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. MENTOR PORTAL HEADER STRIP WITH AMBIENT GLOW & SHEEN */}
      <div className="relative overflow-hidden kbelia-ambient-sheen rounded-2xl bg-slate-50/80 dark:bg-zinc-950/80 border border-slate-200 dark:border-zinc-700 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Autonomous Ambient Glowing Orbs */}
        <div className="pointer-events-none absolute -top-14 -left-10 w-56 h-56 rounded-full bg-teal-500/14 dark:bg-teal-500/16 blur-3xl animate-ambient-orb-a" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-16 right-8 w-52 h-52 rounded-full bg-cyan-500/12 dark:bg-cyan-500/14 blur-3xl animate-ambient-orb-b" aria-hidden="true" />

        <div className="relative z-10 space-y-1">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-black dark:text-white">
            Selamat Kembali, <span className="kbelia-title-shimmer">{currentMentor.name}</span>
          </h1>
          
          <p className="text-xs sm:text-sm text-black/75 dark:text-white/75 max-w-2xl leading-relaxed">
            {currentMentor.title} &middot; <span className="font-semibold text-black dark:text-white">{currentMentor.agency}</span>
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => handleSubTabChange('sessions')}
            className="py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-all flex items-center gap-2 cursor-pointer interactive-press dark:bg-teal-600"
          >
            <Calendar className="w-4 h-4 text-white" />
            <span>Jadual Bimbingan ({totalMentees})</span>
          </button>
          <button
            type="button"
            onClick={() => setIsNewEndorsementModalOpen(true)}
            className="py-2.5 px-4 rounded-xl text-xs font-semibold text-black dark:text-white bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-600 hover:bg-amber-50 dark:hover:bg-zinc-700 transition-all flex items-center gap-2 cursor-pointer interactive-press"
          >
            <Award className="w-4 h-4 text-black dark:text-white/75" />
            <span>Perakuan Geran ({mentorEndorsements.length})</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB 0: RINGKASAN EKSEKUTIF (BENTO SAAS COMMAND CENTER)                */}
      {/* ===================================================================== */}
      {currentSubTab === 'overview' && (() => {
        // District breakdown for Recharts BarChart
        const districtMap = new Map<string, { district: string; sesi: number; perakuan: number }>();
        mentorRegistrations.forEach(r => {
          const key = r.district || 'Lain-lain';
          const curr = districtMap.get(key) || { district: key, sesi: 0, perakuan: 0 };
          curr.sesi += 1;
          districtMap.set(key, curr);
        });
        mentorEndorsements.forEach(e => {
          const key = e.district || 'Lain-lain';
          const curr = districtMap.get(key) || { district: key, sesi: 0, perakuan: 0 };
          curr.perakuan += 1;
          districtMap.set(key, curr);
        });
        const mentorChartData = Array.from(districtMap.values()).slice(0, 7);

        return (
        <div className="space-y-6 animate-in fade-in duration-200">

          {/* 4 Compact Summary KPI Cards inside Overview Bento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SaaSKpiCard
              title="Jumlah Usahawan Mentee"
              value={totalMentees}
              subtitle={`${pendingCount} Menunggu Tindakan`}
              icon={Users}
              trendLabel={pendingCount > 0 ? `${pendingCount} Baharu` : 'Terkawal'}
              trendDirection={pendingCount > 0 ? 'up' : 'neutral'}
              accentColor="sky"
              isLive
              onClick={() => handleSubTabChange('sessions')}
            />

            <SaaSKpiCard
              title="Sesi Bimbingan Disahkan"
              value={confirmedCount}
              subtitle="Kampus & Google Meet Maya"
              icon={Calendar}
              trendLabel={`${completedCount} Selesai`}
              trendDirection={confirmedCount > 0 ? 'up' : 'neutral'}
              accentColor="emerald"
              isLive
              onClick={() => handleSubTabChange('sessions')}
            />

            <SaaSKpiCard
              title="Perakuan Geran Dikeluarkan"
              value={totalEndorsementsCount}
              subtitle="Sah Untuk Semakan Admin"
              icon={Award}
              trendLabel="Aktif"
              trendDirection={totalEndorsementsCount > 0 ? 'up' : 'neutral'}
              accentColor="amber"
              onClick={() => handleSubTabChange('endorsements')}
            />

            <SaaSKpiCard
              title="Rekod Sesi & Tugasan"
              value={totalLogbookCount}
              subtitle="Nota & Tugasan Usahawan"
              icon={FileText}
              trendLabel={`${mentorLogs.reduce((acc, l) => acc + (l.actionItems?.filter(a => a.completed).length || 0), 0)} Selesai`}
              trendDirection={totalLogbookCount > 0 ? 'up' : 'neutral'}
              accentColor="violet"
              onClick={() => handleSubTabChange('logbook')}
            />
          </div>

          {/* Asymmetric Bento Grid (lg:grid-cols-12): Left Analytics + Temujanji, Right Perakuan Geran */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              
              {/* Left Span (7 Cols): Interactive Recharts Analytics + Temujanji Terdekat */}
              <div className="lg:col-span-7 space-y-5">

                {/* Interactive Recharts District & Endorsement Distribution */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 border border-slate-300 dark:border-zinc-700 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-300 dark:border-zinc-600 mb-4">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-black dark:text-white/75" />
                      <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">
                        Taburan Sesi & Perakuan Mengikut Jajahan
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono text-black dark:text-white bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/70 px-2 py-0.5 rounded">
                      {mentorChartData.length} Jajahan
                    </span>
                  </div>

                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mentorChartData} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.22)" />
                        <XAxis dataKey="district" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          cursor={{ fill: 'rgba(13, 148, 136, 0.12)' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload as { district: string; sesi: number; perakuan: number };
                              return (
                                <div className="px-3 py-2 rounded-xl bg-slate-900 text-white text-[11px] font-mono shadow-xl border border-slate-700">
                                  <div className="font-bold text-white mb-1">{d.district}</div>
                                  <div className="text-white/90">Sesi Bimbingan: {d.sesi}</div>
                                  <div className="text-white/90">Perakuan Geran: {d.perakuan}</div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="sesi" name="Sesi Bimbingan" fill="#0D9488" radius={[6, 6, 0, 0]} maxBarSize={28} />
                        <Bar dataKey="perakuan" name="Perakuan Geran" fill="#F59E0B" radius={[6, 6, 0, 0]} maxBarSize={28} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Temujanji Terdekat & Tindakan Segera */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 border border-slate-300 dark:border-zinc-700 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-300 dark:border-slate-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-black dark:text-white/75" />
                      <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">
                        Temujanji Terdekat & Tindakan
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono text-black dark:text-white bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/70 px-2 py-0.5 rounded">
                      {mentorRegistrations.slice(0, 3).length} Sesi Terkini
                    </span>
                  </div>

                  <div className="space-y-3">
                    {mentorRegistrations.slice(0, 3).map((reg) => {
                      const visuals = resolveMenteeVisuals(
                        {
                          applicantId: reg.applicantId,
                          entrepreneurName: reg.entrepreneurName,
                          businessName: reg.businessName,
                          category: reg.businessCategory
                        },
                        businesses
                      );
                      return (
                      <div 
                        key={reg.id}
                        className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="relative w-12 h-10 shrink-0 mt-0.5">
                            <div className="w-full h-full rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-900">
                              <PortalImage
                                src={visuals.businessUrl}
                                alt={reg.businessName}
                                fallbackType="business"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="w-6 h-6 rounded-full overflow-hidden border-2 border-white dark:border-slate-800 shadow-xs absolute -bottom-1 -right-1 bg-white dark:bg-slate-900">
                              <PortalImage
                                src={visuals.avatarUrl}
                                alt={reg.entrepreneurName}
                                fallbackType="avatar"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-black dark:text-white leading-snug break-words">
                              {reg.entrepreneurName}
                            </span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${
                              reg.status === 'confirmed'
                                ? 'bg-amber-100 text-black dark:bg-teal-600 dark:text-white'
                                : reg.status === 'completed'
                                ? 'bg-emerald-100 text-black dark:bg-emerald-950 dark:text-white'
                                : 'bg-amber-100 text-black dark:bg-amber-950 dark:text-white'
                            }`}>
                              {reg.status === 'confirmed' ? 'Disahkan' : reg.status === 'completed' ? 'Selesai' : 'Menunggu'}
                            </span>
                          </div>
                          <p className="text-[11px] text-black/70 dark:text-white/75 leading-relaxed break-words">
                            {reg.businessName} &middot; <span className="font-medium text-black dark:text-white">{reg.district}</span>
                          </p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-black/70 dark:text-white/75 pt-0.5">
                            <Clock className="w-3 h-3 text-black/70 dark:text-white/75 shrink-0" />
                            <span>{reg.preferredDate || 'Akan ditetapkan'} &middot; {reg.preferredTime || '10:00 AM'}</span>
                            <span>&middot;</span>
                            <span>{reg.mode === 'Google Meet Maya' ? 'Google Meet Maya' : 'Bersemuka Kampus'}</span>
                          </div>
                        </div>
                        </div>

                        <div className="shrink-0">
                          {reg.status === 'pending' ? (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(reg, 'confirmed')}
                              className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold transition-all cursor-pointer shadow-2xs whitespace-nowrap dark:bg-teal-600"
                            >
                              Sahkan Sesi
                            </button>
                          ) : reg.meetingLink ? (
                            <a
                              href={reg.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold transition-all inline-flex items-center gap-1.5 shadow-2xs whitespace-nowrap dark:bg-teal-600"
                            >
                              <Video className="w-3 h-3" />
                              <span>Bilik Maya</span>
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSubTabChange('sessions')}
                              className="px-3 py-1.5 rounded-lg bg-white hover:bg-amber-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-black dark:text-white border border-slate-300 dark:border-slate-600 text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap"
                            >
                              Butiran
                            </button>
                          )}
                        </div>
                      </div>
                      );
                    })}

                    {mentorRegistrations.length === 0 && (
                      <div className="py-8 text-center text-xs text-black/70 dark:text-white/75">
                        Tiada temujanji aktif buat masa ini.
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-300 dark:border-slate-600 mt-4 flex items-center justify-between">
                  <span className="text-[11px] text-black/70 dark:text-white/75">
                    Semak jadual lengkap & pengurusan mentee
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSubTabChange('sessions')}
                    className="text-xs font-bold text-black dark:text-white/75 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Buka Sesi Bimbingan</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                </div>

              </div>

              {/* Right Span (5 Cols): Status Perakuan Geran & Dana Benih */}
              <div className="lg:col-span-5 h-full bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 border border-slate-300 dark:border-zinc-700 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-300 dark:border-slate-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-black/70 dark:text-white/75" />
                      <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">
                        Status Perakuan Geran Usahawan
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono text-black dark:text-white bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded">
                      {mentorEndorsements.length} Diluluskan
                    </span>
                  </div>

                  <div className="space-y-3">
                    {mentorEndorsements.slice(0, 3).map((end) => (
                      <div 
                        key={end.id}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-amber-950/20 border border-slate-200 dark:border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-black dark:text-white leading-snug break-words">
                              {end.menteeName}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-black dark:text-white bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded shrink-0">
                              {end.recommendedAmount}
                            </span>
                          </div>
                          <p className="text-[11px] text-black dark:text-white leading-relaxed break-words">
                            {end.businessName} &middot; <span className="text-black/70 dark:text-white/75">{end.district}</span>
                          </p>
                          <p className="text-[10px] font-mono text-black/70 dark:text-white/75 pt-0.5 break-words">
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
                            className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold transition-all cursor-pointer shadow-2xs whitespace-nowrap dark:bg-teal-600"
                          >
                            Lihat Surat
                          </button>
                        </div>
                      </div>
                    ))}

                    {mentorEndorsements.length === 0 && (
                      <div className="py-8 text-center text-xs text-black/70 dark:text-white/75">
                        Belum ada surat perakuan geran dikeluarkan.
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-300 dark:border-slate-600 mt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsNewEndorsementModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs dark:bg-teal-600"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Keluarkan Perakuan Baharu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSubTabChange('endorsements')}
                    className="text-xs font-bold text-black dark:text-white/75 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Senarai Lengkap</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>

            {/* Direktori Ringkas Usahawan Mentee (Integrated Table) */}
            <div className="rounded-2xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
              <div className="px-4 sm:px-5 py-3.5 border-b border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">
                    Direktori Ringkas Usahawan Mentee
                  </h3>
                  <p className="text-[11px] text-black/70 dark:text-white/75">
                    Senarai usahawan belia di bawah pemantauan {currentMentor.name}
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-black/70 dark:text-white/75" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari usahawan, jajahan..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-xs text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/55 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-indigo-600 dark:focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-300 dark:border-slate-600 text-[11px] font-semibold text-black/70 dark:text-white/75">
                      <th className="py-3 px-4">Usahawan & Perniagaan</th>
                      <th className="py-3 px-4">Jajahan</th>
                      <th className="py-3 px-4">Kategori</th>
                      <th className="py-3 px-4">Status Sesi</th>
                      <th className="py-3 px-4">Status Geran</th>
                      <th className="py-3 px-4 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 dark:divide-slate-600">
                    {overviewPagination.paginatedItems.map((mentee) => {
                      const hasEndorsement = mentorEndorsements.some(e => e.menteeName.toLowerCase() === mentee.entrepreneurName.toLowerCase());
                      const visuals = resolveMenteeVisuals(
                        {
                          applicantId: mentee.applicantId,
                          entrepreneurName: mentee.entrepreneurName,
                          businessName: mentee.businessName,
                          category: mentee.businessCategory
                        },
                        businesses
                      );
                      return (
                        <tr 
                          key={mentee.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="relative w-12 h-10 shrink-0">
                                <div className="w-full h-full rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800">
                                  <PortalImage
                                    src={visuals.businessUrl}
                                    alt={mentee.businessName}
                                    fallbackType="business"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="w-6 h-6 rounded-full overflow-hidden border-2 border-white dark:border-slate-900 shadow-xs absolute -bottom-1 -right-1 bg-white dark:bg-slate-800">
                                  <PortalImage
                                    src={visuals.avatarUrl}
                                    alt={mentee.entrepreneurName}
                                    fallbackType="avatar"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-black dark:text-white">{mentee.entrepreneurName}</div>
                                <div className="text-[11px] text-black/70 dark:text-white/75">{mentee.businessName}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-black dark:text-white font-medium">
                            {mentee.district}
                          </td>
                          <td className="py-3 px-4 text-black/70 dark:text-white/75">
                            {mentee.topic}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                              mentee.status === 'confirmed'
                                ? 'bg-amber-100 text-black dark:bg-teal-600 dark:text-white'
                                : mentee.status === 'completed'
                                ? 'bg-emerald-100 text-black dark:bg-emerald-950 dark:text-white'
                                : 'bg-amber-100 text-black dark:bg-amber-950 dark:text-white'
                            }`}>
                              {mentee.status === 'confirmed' ? 'Disahkan' : mentee.status === 'completed' ? 'Selesai' : 'Menunggu'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {hasEndorsement ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-black dark:text-white/75">
                                <Award className="w-3.5 h-3.5" />
                                <span>Diperaku</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-black/70 dark:text-white/75">
                                Belum
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleSubTabChange('sessions')}
                              className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-700 text-black dark:text-white border border-slate-300 dark:border-slate-600 text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap"
                            >
                              Buka Sesi
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {overviewRegistrations.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-xs text-black/70 dark:text-white/75">
                          Tiada rekod usahawan mentee dijumpai.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {overviewRegistrations.length > 5 && (
                <div className="px-4 pb-4">
                  <PaginationBar
                    currentPage={overviewPagination.currentPage}
                    totalItems={overviewPagination.totalItems}
                    itemsPerPage={5}
                    onPageChange={overviewPagination.setCurrentPage}
                    itemLabel="usahawan"
                    accent="teal"
                  />
                </div>
              )}
            </div>

        </div>
        );
      })()}

      {/* ===================================================================== */}
      {/* TAB 1: SESI BIMBINGAN (LAYOUT KEBAWAH PENUH & MESRA BACAAN MESEJ)     */}
      {/* ===================================================================== */}
      {currentSubTab === 'sessions' && (
        <div className="flex flex-col space-y-8 animate-in fade-in duration-200">
          
          {/* =================================================================== */}
          {/* SEKSYEN 1: PERMOHONAN BIMBINGAN (FULL-WIDTH STACKED CARD)           */}
          {/* =================================================================== */}
          <section id="mentor-applications-section" className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 p-5 sm:p-6 shadow-2xs space-y-5 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-300 dark:border-slate-600 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800/70 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-black dark:text-white tracking-tight">
                    Permohonan Bimbingan
                  </h3>
                </div>
                <p className="text-xs text-black dark:text-white/75 mt-1">
                  Senarai padat permohonan aktif (rekod selesai diasingkan di tab Selesai). Klik baris untuk melihat mesej penuh &amp; tindakan.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold tabular-nums px-3 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-black dark:text-white border border-teal-200 dark:border-teal-800/70">
                  {filteredRegistrations.length} {statusFilter === 'completed' ? 'Selesai' : 'Aktif'}
                </span>
              </div>
            </div>

            {/* Quick Search & Filter Controls Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-black/70 dark:text-white/75 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama usahawan, jenama perniagaan atau topik bimbingan..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs sm:text-sm text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/55 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 transition-all dark:focus:border-blue-500"
                />
              </div>

              {/* Status Tabs Filter: Semua (Aktif) | Menunggu | Disahkan | Selesai */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {(['all', 'pending', 'confirmed', 'completed'] as const).map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setStatusFilter(tab)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer tabular-nums ${
                      statusFilter === tab
                        ? 'bg-teal-600 text-white shadow-xs font-bold dark:bg-teal-600'
                        : 'text-black dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 hover:bg-amber-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {tab === 'all'
                      ? `Semua Aktif (${activeCount})`
                      : tab === 'pending'
                      ? `Menunggu (${pendingCount})`
                      : tab === 'confirmed'
                      ? `Disahkan (${confirmedCount})`
                      : `Selesai (${completedCount})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Mentee Applications Compact Expandable List */}
            <div className="pt-1">
              {filteredRegistrations.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-300 dark:border-slate-600 rounded-2xl bg-slate-50 dark:bg-slate-900">
                  <GraduationCap className="w-10 h-10 text-black/70 dark:text-white/75 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-bold text-black dark:text-white">
                    {statusFilter === 'completed'
                      ? 'Tiada rekod bimbingan yang telah selesai buat masa ini.'
                      : 'Tiada permohonan bimbingan aktif buat masa ini.'}
                  </p>
                  <p className="text-xs text-black/70 dark:text-white/75 mt-1">
                    {statusFilter !== 'completed' && completedCount > 0
                      ? 'Permohonan yang telah selesai dibimbing dipaparkan secara berasingan di tab Selesai.'
                      : 'Cuba tukar kata kunci carian atau pilih tab status lain di atas.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700 overflow-hidden">
                    {applicationsPagination.paginatedItems.map(mentee => {
                      const isPending = mentee.status === 'pending';
                      const isConfirmed = mentee.status === 'confirmed';
                      const isCompleted = mentee.status === 'completed';
                      const isExpanded = Boolean(expandedApplicationIds[mentee.id]);

                      const rawPhone = mentee.entrepreneurPhone || (mentee as any).phone || '';
                      const cleanPhone = typeof rawPhone === 'string' ? rawPhone.replace(/[^0-9]/g, '') : '';
                      const visuals = resolveMenteeVisuals(
                        {
                          applicantId: mentee.applicantId,
                          entrepreneurName: mentee.entrepreneurName,
                          businessName: mentee.businessName,
                          category: mentee.businessCategory
                        },
                        businesses
                      );

                      return (
                        <div key={mentee.id} className="transition-colors">
                          {/* Compact Summary Row */}
                          <div
                            onClick={() =>
                              setExpandedApplicationIds(prev => ({ ...prev, [mentee.id]: !prev[mentee.id] }))
                            }
                            className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                              <div className="relative w-14 h-11 sm:w-16 sm:h-12 shrink-0">
                                <div className="w-full h-full rounded-xl overflow-hidden border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800">
                                  <PortalImage
                                    src={visuals.businessUrl}
                                    alt={mentee.businessName}
                                    fallbackType="business"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border-2 border-white dark:border-slate-900 shadow-sm absolute -bottom-1.5 -right-1.5 bg-white dark:bg-slate-800">
                                  <PortalImage
                                    src={visuals.avatarUrl}
                                    alt={mentee.entrepreneurName}
                                    fallbackType="avatar"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </div>

                              <div className="min-w-0 flex-1 space-y-0.5">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                  <h4 className="text-sm font-bold text-black dark:text-white leading-snug">
                                    {mentee.entrepreneurName}
                                  </h4>
                                  <span className="text-black/35 dark:text-white/35 text-xs">&middot;</span>
                                  <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                                    {mentee.businessName}
                                  </span>
                                </div>
                                <p className="text-[11px] text-black/70 dark:text-white/75 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 leading-relaxed">
                                  <span>{mentee.district || 'Kelantan'}</span>
                                  <span>&middot;</span>
                                  <span>{mentee.businessCategory || 'Perniagaan Belia'}</span>
                                  <span>&middot;</span>
                                  <span className="font-medium text-black dark:text-white">{mentee.topic}</span>
                                  {mentee.preferredDate && (
                                    <>
                                      <span>&middot;</span>
                                      <span className="tabular-nums">{mentee.preferredDate} ({mentee.preferredTime || '10:00 AM'})</span>
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pl-17 sm:pl-0">
                              <span
                                className={`inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-lg border whitespace-nowrap ${
                                  isCompleted
                                    ? 'bg-emerald-50 dark:bg-emerald-950/70 text-black dark:text-white border-emerald-200 dark:border-emerald-800'
                                    : isConfirmed
                                    ? 'bg-teal-50 dark:bg-teal-950/60 text-black dark:text-white border-teal-200 dark:border-teal-800/70'
                                    : isPending
                                    ? 'bg-amber-50 dark:bg-amber-950/70 text-black dark:text-white border-amber-200 dark:border-amber-800'
                                    : 'bg-rose-50 dark:bg-rose-950/70 text-black dark:text-white border-rose-200 dark:border-rose-800'
                                }`}
                              >
                                {isCompleted ? 'Selesai' : isConfirmed ? 'Disahkan' : isPending ? 'Menunggu' : 'Dibatalkan'}
                              </span>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedApplicationIds(prev => ({ ...prev, [mentee.id]: !prev[mentee.id] }));
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-xs font-semibold text-black dark:text-white inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                              >
                                <span>{isExpanded ? 'Tutup' : 'Butiran'}</span>
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          {/* Expandable Details Drawer */}
                          {isExpanded && (
                            <div className="px-4 sm:px-5 pb-4 pt-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 space-y-3 animate-in fade-in duration-150">
                              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1.5">
                                <div className="flex items-center gap-2 text-xs font-bold text-black dark:text-white">
                                  <MessageSquare className="w-3.5 h-3.5 text-black/70 dark:text-white/75" />
                                  <span>Mesej Permohonan &amp; Cabaran Usahawan:</span>
                                </div>
                                <p className="text-xs sm:text-sm leading-relaxed text-black dark:text-white whitespace-pre-line">
                                  {mentee.challenges ? (
                                    `"${mentee.challenges}"`
                                  ) : (
                                    <span className="italic text-black/70 dark:text-white/75">
                                      "Usahawan memohon sesi bimbingan khusus bagi strategi pemasaran, pengurusan kos operasi, dan persediaan dokumentasi permohonan geran belia UMK."
                                    </span>
                                  )}
                                </p>
                              </div>

                              {mentee.mentorActionPlan && (
                                <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800/70 space-y-1">
                                  <div className="flex items-center justify-between text-xs font-bold text-black dark:text-white">
                                    <span className="flex items-center gap-1.5">
                                      <FileText className="w-3.5 h-3.5" />
                                      <span>Nota Bimbingan Mentor Tersimpan:</span>
                                    </span>
                                    <span className="text-[11px] font-normal opacity-75">Telah dihantar</span>
                                  </div>
                                  <p className="text-xs text-black dark:text-white whitespace-pre-line leading-relaxed">
                                    {mentee.mentorActionPlan}
                                  </p>
                                </div>
                              )}

                              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                                <a
                                  href={cleanPhone ? `https://wa.me/${cleanPhone}?text=Salam%20${encodeURIComponent(mentee.entrepreneurName)}%2C%20saya%20mentor%20anda%20dari%20KBelia%20UMK.` : '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-black dark:text-white bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                  <span>WhatsApp Usahawan</span>
                                </a>

                                <div className="flex flex-wrap items-center gap-2">
                                  {isPending && (
                                    <button
                                      type="button"
                                      onClick={() => handleStatusChange(mentee, 'confirmed')}
                                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs dark:bg-teal-600"
                                    >
                                      <Calendar className="w-3.5 h-3.5" />
                                      <span>Sahkan Sesi Bimbingan</span>
                                    </button>
                                  )}

                                  {isConfirmed && (
                                    <button
                                      type="button"
                                      onClick={() => handleStatusChange(mentee, 'completed')}
                                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Tandakan Selesai Sesi</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleOpenNotesModal(mentee)}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-black dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-amber-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>{mentee.mentorActionPlan ? 'Kemaskini Nota Bimbingan' : '+ Tambah Nota Bimbingan'}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setNewEndorsementMenteeName(mentee.entrepreneurName);
                                      setNewEndorsementBusinessName(mentee.businessName);
                                      setNewEndorsementDistrict(mentee.district);
                                      setIsNewEndorsementModalOpen(true);
                                    }}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-black dark:text-white bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Award className="w-3.5 h-3.5" />
                                    <span>Perakuan Geran</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <PaginationBar
                    currentPage={applicationsPagination.currentPage}
                    totalItems={applicationsPagination.totalItems}
                    itemsPerPage={5}
                    onPageChange={applicationsPagination.setCurrentPage}
                    itemLabel="permohonan"
                    accent="teal"
                  />
                </>
              )}
            </div>
          </section>

          {/* =================================================================== */}
          {/* SEKSYEN 2: JADUAL (COMPACT EXPANDABLE LIST + PAGINATION)            */}
          {/* =================================================================== */}
          <section id="mentor-schedule-section" className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 p-5 sm:p-6 shadow-2xs space-y-5 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-300 dark:border-slate-600 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/70 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-black dark:text-white tracking-tight">
                    Jadual
                  </h3>
                </div>
                <p className="text-xs text-black dark:text-white/75 mt-1">
                  Takwim sesi temujanji aktif bersemuka di bilik bimbingan UMK serta sesi Google Meet maya.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsNewSlotModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer self-start sm:self-auto dark:bg-blue-600"
              >
                <Plus className="w-4 h-4" />
                <span>+ Slot Baharu</span>
              </button>
            </div>

            {/* Confirmed Sessions Compact Expandable List */}
            <div>
              {confirmedScheduleSessions.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-300 dark:border-slate-600 rounded-2xl bg-slate-50 dark:bg-slate-900">
                  <Clock className="w-10 h-10 text-black/70 dark:text-white/75 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-bold text-black dark:text-white">Tiada sesi bimbingan aktif ditetapkan dalam jadual.</p>
                  <p className="text-xs text-black/70 dark:text-white/75 mt-1">Sahkan permohonan bimbingan di bahagian atas untuk menjadualkan tarikh dan slot.</p>
                </div>
              ) : (
                <>
                  <div className="rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700 overflow-hidden">
                    {schedulePagination.paginatedItems.map((mentee) => {
                      const rawPhone = mentee.entrepreneurPhone || (mentee as any).phone || '';
                      const cleanPhone = typeof rawPhone === 'string' ? rawPhone.replace(/[^0-9]/g, '') : '';
                      const isExpanded = Boolean(expandedScheduleIds[mentee.id]);
                      const visuals = resolveMenteeVisuals(
                        {
                          applicantId: mentee.applicantId,
                          entrepreneurName: mentee.entrepreneurName,
                          businessName: mentee.businessName,
                          category: mentee.businessCategory
                        },
                        businesses
                      );

                      return (
                        <div key={mentee.id}>
                          <div
                            onClick={() =>
                              setExpandedScheduleIds(prev => ({ ...prev, [mentee.id]: !prev[mentee.id] }))
                            }
                            className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                              <div className="relative w-14 h-11 shrink-0">
                                <div className="w-full h-full rounded-xl overflow-hidden border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800">
                                  <PortalImage
                                    src={visuals.businessUrl}
                                    alt={mentee.businessName}
                                    fallbackType="business"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-white dark:border-slate-900 shadow-sm absolute -bottom-1.5 -right-1.5 bg-white dark:bg-slate-800">
                                  <PortalImage
                                    src={visuals.avatarUrl}
                                    alt={mentee.entrepreneurName}
                                    fallbackType="avatar"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </div>

                              <div className="min-w-0 flex-1 space-y-0.5">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                  <h4 className="text-sm font-bold text-black dark:text-white">
                                    {mentee.entrepreneurName}
                                  </h4>
                                  <span className="text-black/35 dark:text-white/35 text-xs">&middot;</span>
                                  <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                                    {mentee.businessName}
                                  </span>
                                </div>
                                <p className="text-[11px] text-black/70 dark:text-white/75 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 tabular-nums">
                                  <span className="font-semibold text-black dark:text-white">
                                    {mentee.preferredDate || 'Akan Ditetapkan'} &middot; {mentee.preferredTime || '10:00 AM'}
                                  </span>
                                  <span>&middot;</span>
                                  <span>{mentee.meetingLink ? 'Google Meet Maya' : 'Bilik Bimbingan UMK CEED'}</span>
                                  <span>&middot;</span>
                                  <span>{mentee.district || 'Kelantan'}</span>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pl-17 sm:pl-0">
                              {mentee.meetingLink && (
                                <a
                                  href={mentee.meetingLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors whitespace-nowrap"
                                >
                                  <Video className="w-3 h-3" />
                                  <span>Google Meet</span>
                                </a>
                              )}

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedScheduleIds(prev => ({ ...prev, [mentee.id]: !prev[mentee.id] }));
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-xs font-semibold text-black dark:text-white inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                              >
                                <span>{isExpanded ? 'Tutup' : 'Butiran'}</span>
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="px-4 sm:px-5 pb-4 pt-3 border-t border-slate-200 dark:border-slate-700 bg-teal-50/40 dark:bg-teal-950/20 space-y-3 animate-in fade-in duration-150">
                              <div className="text-xs text-black dark:text-white space-y-1">
                                <p>
                                  Topik Perbincangan: <strong className="font-semibold">{mentee.topic}</strong>
                                </p>
                                {mentee.challenges && (
                                  <p className="text-black/75 dark:text-white/75 italic">
                                    Nota usahawan: &quot;{mentee.challenges}&quot;
                                  </p>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                                {cleanPhone ? (
                                  <a
                                    href={`https://wa.me/${cleanPhone}?text=Salam%20${encodeURIComponent(mentee.entrepreneurName)}%2C%20peringatan%20sesi%20bimbingan%20kita%20pada%20${encodeURIComponent(mentee.preferredDate || 'tarikh dijadualkan')}.`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-black dark:text-white/75 font-bold hover:underline flex items-center gap-1"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                    <span>Hantar Peringatan WhatsApp</span>
                                  </a>
                                ) : <span />}

                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenNotesModal(mentee)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-black dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-amber-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                  >
                                    Nota Bimbingan
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
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <PaginationBar
                    currentPage={schedulePagination.currentPage}
                    totalItems={schedulePagination.totalItems}
                    itemsPerPage={5}
                    onPageChange={schedulePagination.setCurrentPage}
                    itemLabel="sesi disahkan"
                    accent="teal"
                  />
                </>
              )}
            </div>
          </section>

          {/* =================================================================== */}
          {/* SEKSYEN 3: PELAN TINDAKAN (COMPACT EXPANDABLE LIST + PAGINATION)    */}
          {/* =================================================================== */}
          <section id="mentor-action-plans-section" className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 p-5 sm:p-6 shadow-2xs space-y-5 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-300 dark:border-slate-600 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/70 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-black dark:text-white tracking-tight">
                    Nota Bimbingan Usahawan
                  </h3>
                </div>
                <p className="text-xs text-black dark:text-white/75 mt-1">
                  Panduan bimbingan, sasaran jualan, dan pelan susulan usahawan.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold tabular-nums px-3 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-black dark:text-white border border-teal-200 dark:border-teal-800/70">
                  {actionPlanMentees.length} Nota Disediakan
                </span>
              </div>
            </div>

            <div>
              {actionPlanMentees.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-300 dark:border-slate-600 rounded-2xl bg-slate-50 dark:bg-slate-900 space-y-2">
                  <MessageSquare className="w-10 h-10 text-black/70 dark:text-white/75 mx-auto opacity-50" />
                  <p className="text-sm font-bold text-black dark:text-white">Belum ada nota bimbingan lagi.</p>
                  <p className="text-xs text-black/70 dark:text-white/75">Tekan &quot;+ Tambah Nota Bimbingan&quot; pada senarai sesi di atas untuk rekodkan panduan bisnes usahawan.</p>
                </div>
              ) : (
                <>
                  <div className="rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700 overflow-hidden">
                    {actionPlansPagination.paginatedItems.map((mentee) => {
                      const isExpanded = Boolean(expandedActionPlanIds[mentee.id]);
                      const visuals = resolveMenteeVisuals(
                        {
                          applicantId: mentee.applicantId,
                          entrepreneurName: mentee.entrepreneurName,
                          businessName: mentee.businessName,
                          category: mentee.businessCategory
                        },
                        businesses
                      );
                      return (
                        <div key={mentee.id}>
                          <div
                            onClick={() =>
                              setExpandedActionPlanIds(prev => ({ ...prev, [mentee.id]: !prev[mentee.id] }))
                            }
                            className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                              <div className="relative w-14 h-11 shrink-0">
                                <div className="w-full h-full rounded-xl overflow-hidden border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800">
                                  <PortalImage
                                    src={visuals.businessUrl}
                                    alt={mentee.businessName}
                                    fallbackType="business"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-white dark:border-slate-900 shadow-sm absolute -bottom-1.5 -right-1.5 bg-white dark:bg-slate-800">
                                  <PortalImage
                                    src={visuals.avatarUrl}
                                    alt={mentee.entrepreneurName}
                                    fallbackType="avatar"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </div>

                              <div className="min-w-0 flex-1 space-y-0.5">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                  <h4 className="text-sm font-bold text-black dark:text-white">
                                    {mentee.entrepreneurName}
                                  </h4>
                                  <span className="text-black/35 dark:text-white/35 text-xs">&middot;</span>
                                  <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                                    {mentee.businessName}
                                  </span>
                                </div>
                                <p className="text-[11px] text-black/70 dark:text-white/75 flex flex-wrap items-center gap-x-1.5">
                                  <span>{mentee.topic}</span>
                                  <span>&middot;</span>
                                  <span>{mentee.district || 'Kelantan'}</span>
                                  <span>&middot;</span>
                                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Tersimpan</span>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 shrink-0 pl-17 sm:pl-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedActionPlanIds(prev => ({ ...prev, [mentee.id]: !prev[mentee.id] }));
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-xs font-semibold text-black dark:text-white inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                              >
                                <span>{isExpanded ? 'Tutup' : 'Lihat Nota'}</span>
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="px-4 sm:px-5 pb-4 pt-3 border-t border-slate-200 dark:border-slate-700 bg-teal-50/40 dark:bg-teal-950/20 space-y-3 animate-in fade-in duration-150">
                              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800/70 space-y-1.5">
                                <span className="text-xs font-bold text-black dark:text-white block">
                                  Garis Panduan &amp; Sasaran Tindakan Mentor:
                                </span>
                                <p className="text-xs sm:text-sm text-black dark:text-white whitespace-pre-line leading-relaxed font-sans">
                                  {mentee.mentorActionPlan}
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-black/70 dark:text-white/75">
                                <span>Penyeliaan berterusan di bawah inisiatif keusahawanan UMK CEED</span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenNotesModal(mentee)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-black dark:text-white bg-amber-100 dark:bg-teal-600 hover:bg-amber-200 transition-colors cursor-pointer"
                                >
                                  Kemaskini Nota Bimbingan
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <PaginationBar
                    currentPage={actionPlansPagination.currentPage}
                    totalItems={actionPlansPagination.totalItems}
                    itemsPerPage={5}
                    onPageChange={actionPlansPagination.setCurrentPage}
                    itemLabel="nota bimbingan"
                    accent="teal"
                  />
                </>
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
          <div className="p-5 kbelia-important-header dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-black dark:text-white/75 shrink-0" />
                <h3 className="text-base font-bold text-black dark:text-white">
                  Pengeluaran Surat Perakuan Rasmi Geran Belia UMK
                </h3>
              </div>
              <p className="text-xs text-black dark:text-white max-w-2xl leading-relaxed">
                Mentor berdaftar boleh menilai usahawan dan mengeluarkan Surat Sokongan Geran. Dokumen bertandatangan rasmi ini diperlukan oleh pihak admin KBelia untuk meluluskan Geran Permulaan (RM3,000) dan Geran Pemangkin (RM5,000).
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsNewEndorsementModalOpen(true)}
              className="interactive-press interactive-lift px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer dark:bg-teal-600"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Keluarkan Surat Perakuan Baharu</span>
            </button>
          </div>

          {/* List of Issued Endorsements */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-300 dark:border-slate-600">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-black dark:text-white/75" />
                <h4 className="text-sm font-bold text-black dark:text-white">
                  Senarai Surat Perakuan Geran yang Telah Dikeluarkan ({mentorEndorsements.length})
                </h4>
              </div>
              <span className="text-[11px] text-black/70 dark:text-white/75">
                Disahkan oleh Universiti Malaysia Kelantan
              </span>
            </div>

            {mentorEndorsements.length === 0 ? (
              <div className="py-10 text-center text-xs text-black/70 dark:text-white/75 border border-dashed border-slate-300 dark:border-slate-600 rounded-2xl">
                Tiada surat perakuan geran dikeluarkan di bawah seliaan anda buat masa ini.
              </div>
            ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {endorsementsPagination.paginatedItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 p-4 space-y-3 hover:border-blue-400/70 dark:hover:border-blue-400/70 transition-all shadow-2xs flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-black dark:text-white bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/70 px-2 py-0.5 rounded">
                        {item.endorsementCode}
                      </span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-black dark:bg-emerald-950/70 dark:text-white flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>Disahkan Rasmi</span>
                      </span>
                    </div>

                    <div>
                      <h5 className="text-xs font-bold text-black dark:text-white">
                        {item.menteeName}
                      </h5>
                      <p className="text-[11px] text-black/70 dark:text-white/75">
                        {item.businessName} &middot; <span className="font-medium text-black dark:text-white">{item.district}</span>
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40 space-y-1">
                      <div className="text-[10px] uppercase font-bold text-black dark:text-white">
                        {item.grantProgramTitle}
                      </div>
                      <div className="text-base font-black text-black dark:text-white/75">
                        {item.recommendedAmount}
                      </div>
                    </div>

                    <p className="text-[11px] text-black dark:text-white line-clamp-3 leading-relaxed italic bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-300 dark:border-slate-600">
                      "{item.justification}"
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-300 dark:border-slate-600 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-black/70 dark:text-white/75">
                      Tarikh: {item.issuedAt}
                    </span>

                    <button
                      type="button"
                      onClick={() => setSelectedEndorsementForView(item)}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs dark:bg-teal-600"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Lihat & Cetak Surat</span>
                    </button>
                  </div>
                </div>
                ))}
              </div>
              <PaginationBar
                currentPage={endorsementsPagination.currentPage}
                totalItems={endorsementsPagination.totalItems}
                itemsPerPage={5}
                onPageChange={endorsementsPagination.setCurrentPage}
                itemLabel="surat perakuan"
                accent="teal"
              />
            </>
            )}
          </div>

        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: LOG JURNAL & PELAN TINDAKAN MENTEE                              */}
      {/* ===================================================================== */}
      {currentSubTab === 'logbook' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-black dark:text-white/75 shrink-0" />
                <h3 className="text-base font-bold text-black dark:text-white">
                  Rekod Sesi Bimbingan & Tugasan Usahawan
                </h3>
              </div>
              <p className="text-xs text-black dark:text-white max-w-2xl leading-relaxed">
                Catatkan nota perbincangan sesi bimbingan, sasaran peniaga, dan senarai tugasan penting usahawan. Anda boleh menyemak kemajuan tugasan secara berterusan supaya sasaran bisnes tercapai.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsNewLogModalOpen(true)}
              className="interactive-press interactive-lift px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer dark:bg-teal-600"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Tambah Rekod Sesi</span>
            </button>
          </div>

          <div>
            {mentorLogs.length === 0 ? (
              <div className="py-10 text-center text-xs text-black/70 dark:text-white/75 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600">
                Belum ada rekod sesi bimbingan untuk usahawan seliaan anda.
              </div>
            ) : (
              <>
                <div className="rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700 overflow-hidden shadow-2xs">
                  {logsPagination.paginatedItems.map((log) => {
                    const isExpanded = Boolean(expandedLogIds[log.id]);
                    const totalTasks = log.actionItems?.length || 0;
                    const doneTasks = log.actionItems?.filter(a => a.completed).length || 0;
                    const visuals = resolveMenteeVisuals(
                      {
                        entrepreneurName: log.menteeName,
                        businessName: log.businessName
                      },
                      businesses
                    );
                    return (
                      <div key={log.id}>
                        <div
                          onClick={() =>
                            setExpandedLogIds(prev => ({ ...prev, [log.id]: !prev[log.id] }))
                          }
                          className="p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <div className="relative w-14 h-11 sm:w-16 sm:h-12 shrink-0">
                              <div className="w-full h-full rounded-xl overflow-hidden border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-900">
                                <PortalImage
                                  src={visuals.businessUrl}
                                  alt={log.businessName}
                                  fallbackType="business"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm absolute -bottom-1.5 -right-1.5 bg-white dark:bg-slate-900">
                                <PortalImage
                                  src={visuals.avatarUrl}
                                  alt={log.menteeName}
                                  fallbackType="avatar"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </div>

                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                <h4 className="text-sm font-bold text-black dark:text-white">
                                  {log.menteeName}
                                </h4>
                                <span className="text-black/35 dark:text-white/35 text-xs">&middot;</span>
                                <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                                  {log.businessName}
                                </span>
                              </div>
                              <p className="text-[11px] text-black/70 dark:text-white/75 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                                <span className="font-mono tabular-nums">{log.sessionDate}</span>
                                <span>&middot;</span>
                                <span className="font-medium text-black dark:text-white">{log.topic}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pl-17 sm:pl-0">
                            {totalTasks > 0 && (
                              <span
                                className={`text-[11px] font-bold tabular-nums px-2.5 py-1 rounded-lg border whitespace-nowrap ${
                                  doneTasks === totalTasks
                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-black dark:text-white'
                                    : 'bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800/70 text-black dark:text-white'
                                }`}
                              >
                                {doneTasks}/{totalTasks} Tugasan
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedLogIds(prev => ({ ...prev, [log.id]: !prev[log.id] }));
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-xs font-semibold text-black dark:text-white inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                            >
                              <span>{isExpanded ? 'Tutup' : 'Butiran'}</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="px-4 sm:px-5 pb-4 pt-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 space-y-3.5 animate-in fade-in duration-150">
                            <div className="space-y-1.5">
                              <div className="text-xs font-bold text-black dark:text-white">
                                Ringkasan Minit Bimbingan Mentor:
                              </div>
                              <p className="text-xs text-black dark:text-white bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 leading-relaxed font-sans">
                                {log.minutes}
                              </p>
                            </div>

                            {log.actionItems && log.actionItems.length > 0 && (
                              <div className="space-y-2">
                                <div className="text-xs font-bold text-black dark:text-white flex items-center justify-between gap-2 flex-wrap">
                                  <span>Senarai Semak Tugasan Wajib Mentee:</span>
                                  <span className="text-[11px] text-black/70 dark:text-white/75 font-normal">
                                    Tekan kotak untuk tandakan status selesai
                                  </span>
                                </div>

                                <div className="space-y-2">
                                  {log.actionItems.map((task) => (
                                    <div
                                      key={task.id}
                                      onClick={() => handleToggleLogTask(log.id, task.id)}
                                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                                        task.completed
                                          ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-black/70 dark:text-white/75 line-through'
                                          : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 hover:border-blue-400/70 dark:hover:border-blue-400/70 text-black dark:text-white'
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

                                      <span className={`text-[10px] font-mono tabular-nums px-2 py-0.5 rounded shrink-0 ${
                                        task.completed ? 'bg-emerald-100 text-black' : 'bg-slate-50 dark:bg-slate-800 text-black dark:text-white border border-slate-300 dark:border-slate-600'
                                      }`}>
                                        Sasaran: {task.dueDate}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <PaginationBar
                  currentPage={logsPagination.currentPage}
                  totalItems={logsPagination.totalItems}
                  itemsPerPage={5}
                  onPageChange={logsPagination.setCurrentPage}
                  itemLabel="rekod sesi"
                  accent="teal"
                />
              </>
            )}
          </div>

        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: PROFIL MENTOR & JADUAL KELAPANGAN                              */}
      {/* ===================================================================== */}
      {currentSubTab === 'profile' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 p-6 shadow-2xs space-y-6 animate-in fade-in duration-200">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-300 dark:border-slate-600">
            <div>
              <h3 className="text-lg font-bold text-black dark:text-white">
                Profil & Maklumat Mentor
              </h3>
              <p className="text-xs text-black dark:text-white/75">
                Maklumat ini dipaparkan kepada usahawan belia yang ingin memohon bimbingan perniagaan.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsEditProfileOpen(true)}
              className="interactive-press interactive-lift px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 cursor-pointer dark:bg-teal-600"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profil Saya</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-black dark:text-white/75 block mb-1">
                  Nama Penuh & Gelaran:
                </label>
                <div className="text-sm font-bold text-black dark:text-white p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600">
                  {currentMentor.name}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-black dark:text-white/75 block mb-1">
                  Jawatan & Agensi:
                </label>
                <div className="text-sm font-medium text-black dark:text-white p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600">
                  {currentMentor.title} &middot; <span className="font-bold text-black dark:text-white/75">{currentMentor.agency}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-black dark:text-white/75 block mb-1">
                  Saluran Perhubungan Rasmi:
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-black dark:text-white p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600">
                    <Phone className="w-4 h-4 text-black dark:text-white" />
                    <span>WhatsApp: +{currentMentor.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-black dark:text-white p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600">
                    <Mail className="w-4 h-4 text-black dark:text-white" />
                    <span>Emel Rasmi: {currentMentor.email}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-black dark:text-white/75 block mb-1">
                  Waktu & Hari Kelapangan Bimbingan:
                </label>
                <div className="text-sm font-bold text-black dark:text-white p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-black/70 dark:text-white/75" />
                  <span>{currentMentor.availableDays}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-black dark:text-white/75 block mb-1">
                  Bidang Pengkhususan Bimbingan:
                </label>
                <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600">
                  {currentMentor.expertise.map((exp, idx) => (
                    <span key={idx} className="text-xs font-semibold bg-teal-50 text-black border border-teal-200 dark:bg-teal-950/60 dark:text-white dark:border-teal-800/70 px-3 py-1 rounded-lg">
                      {exp}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-black dark:text-white/75 block mb-1">
                  Biodata Ringkas Mentor:
                </label>
                <p className="text-xs text-black dark:text-white p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 leading-relaxed font-sans">
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
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-300 dark:border-slate-600 max-h-[92vh] overflow-y-auto overflow-hidden">
            
            <div className="kbelia-important-header px-6 sm:px-7 pt-6 pb-4 flex items-start justify-between gap-4 border-b border-slate-300 dark:border-slate-600">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-black dark:bg-amber-950/80 dark:text-white dark:border-amber-800 flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-black dark:text-white">
                    Borang Perakuan Rasmi Geran Belia
                  </h3>
                  <p className="text-xs text-black/70 dark:text-white/75">
                    Universiti Malaysia Kelantan &bull; Hab Usahawan Belia KBelia
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewEndorsementModalOpen(false)}
                className="p-1.5 rounded-lg text-black/70 dark:text-white/75 hover:text-black hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGrantEndorsement} className="px-6 sm:px-7 pb-6 sm:pb-7 pt-4 space-y-3.5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-black dark:text-white mb-1">
                    Nama Penuh Usahawan:
                  </label>
                  <input
                    type="text"
                    required
                    value={newEndorsementMenteeName}
                    onChange={(e) => setNewEndorsementMenteeName(e.target.value)}
                    placeholder="Cth: Siti Aminah binti Yusof"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-black dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 dark:focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-black dark:text-white mb-1">
                    Nama Syarikat / Jenama:
                  </label>
                  <input
                    type="text"
                    required
                    value={newEndorsementBusinessName}
                    onChange={(e) => setNewEndorsementBusinessName(e.target.value)}
                    placeholder="Cth: Sambal Tok Abah Original"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-black dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 dark:focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-black dark:text-white mb-1">
                    Kategori Perniagaan:
                  </label>
                  <select
                    value={newEndorsementCategory}
                    onChange={(e) => setNewEndorsementCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-black dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 dark:focus:border-blue-500"
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
                  <label className="block text-xs font-bold text-black dark:text-white mb-1">
                    Jajahan Operasi:
                  </label>
                  <select
                    value={newEndorsementDistrict}
                    onChange={(e) => setNewEndorsementDistrict(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-black dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 dark:focus:border-blue-500"
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
                <label className="block text-xs font-bold text-black dark:text-white mb-1">
                  Cadangan Jenis Geran Bantuan:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewEndorsementGrantType('RM3,000')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      newEndorsementGrantType === 'RM3,000'
                        ? 'bg-emerald-50 text-black border-emerald-600 font-bold dark:bg-emerald-950/60 dark:text-white'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-black dark:text-white/75 hover:border-blue-400/70'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-semibold">Geran Permulaan</div>
                    <div className="text-sm font-black">RM3,000</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewEndorsementGrantType('RM5,000')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      newEndorsementGrantType === 'RM5,000'
                        ? 'bg-emerald-50 text-black border-emerald-600 font-bold dark:bg-emerald-950/60 dark:text-white'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-black dark:text-white/75 hover:border-blue-400/70'
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
                        ? 'bg-emerald-50 text-black border-emerald-600 font-bold dark:bg-emerald-950/60 dark:text-white'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-black dark:text-white/75 hover:border-blue-400/70'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-semibold">Dana Pertumbuhan</div>
                    <div className="text-sm font-black">RM10,000</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-black dark:text-white mb-1">
                  Ulasan Justifikasi Mentor (Mengapa usahawan ini disokong):
                </label>
                <textarea
                  required
                  rows={3}
                  value={newEndorsementJustification}
                  onChange={(e) => setNewEndorsementJustification(e.target.value)}
                  placeholder="Terangkan komitmen usahawan, prestasi jualan, potensi produk, dan kesan penggunaan dana geran terhadap operasi..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-black dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-emerald-600 leading-relaxed font-sans dark:focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-black dark:text-white mb-1">
                  Catatan Kesediaan Bisnes & Kematangan Operasi:
                </label>
                <input
                  type="text"
                  value={newEndorsementReadiness}
                  onChange={(e) => setNewEndorsementReadiness(e.target.value)}
                  placeholder="Cth: Telah lulus 3 sesi bimbingan mentor & mematuhi piawaian pembungkusan UMK"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-black dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-emerald-600 dark:focus:border-blue-500"
                />
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/60 rounded-xl border border-amber-200 dark:border-amber-800/70">
                <label className="flex items-start gap-2.5 text-xs text-black dark:text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEndorsementConfirmed}
                    onChange={(e) => setIsEndorsementConfirmed(e.target.checked)}
                    className="mt-0.5 rounded text-black dark:text-white focus:ring-blue-500/30 w-4 h-4 cursor-pointer"
                  />
                  <span className="leading-relaxed">
                    Saya mengesahkan bahawa saya telah menyemak dokumen perniagaan dan membimbing usahawan belia ini. Perakuan ini dibuat dengan penuh integriti untuk semakan pihak pentadbir.
                  </span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-300 dark:border-slate-600 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewEndorsementModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-black dark:text-white/75 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm flex items-center gap-1.5 cursor-pointer dark:bg-blue-600"
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
          <div className="w-full max-w-2xl bg-white text-black rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-300 max-h-[94vh] overflow-y-auto space-y-6">
            
            {/* Action Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-300">
              <span className="text-xs font-bold text-black uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-black" />
                Dokumen Rasmi Sokongan Geran Belia
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-black border border-slate-300 hover:border-blue-400/70 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedEndorsementForView(null)}
                  className="p-1 rounded-lg text-black/70 hover:text-black hover:bg-slate-100 cursor-pointer"
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
                  <h3 className="font-black text-base tracking-tight text-black uppercase">
                    UNIVERSITI MALAYSIA KELANTAN
                  </h3>
                  <p className="text-[11px] font-semibold text-black uppercase tracking-wider">
                    INSTITUT KEUSAHAWANAN UMK (UMK CEED) &bull; HAB NIAGA BELIA KELANTAN
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-black/70 pt-1">
                Kampus Kota, Pengkalan Chepa, 16100 Kota Bharu, Kelantan &bull; Tel: +609-771 7000
              </p>
            </div>

            {/* Reference Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2 pt-1 font-mono">
              <div>
                <span className="text-black/70 font-sans">No. Rujukan: </span>
                <strong className="text-black">{selectedEndorsementForView.endorsementCode}</strong>
              </div>
              <div>
                <span className="text-black/70 font-sans">Tarikh Perakuan: </span>
                <strong>{selectedEndorsementForView.issuedAt}</strong>
              </div>
            </div>

            {/* Recipient */}
            <div className="text-xs space-y-1">
              <p className="font-semibold text-black">Kepada:</p>
              <p className="font-bold text-black">Urus Setia Jawatankuasa Penilaian Geran Usahawan Belia Kelantan</p>
              <p className="text-black">Pusat Pembangunan Usahawan Belia & Majlis Tindakan Ekonomi Negeri</p>
            </div>

            {/* Title */}
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
              <h4 className="font-bold text-sm text-black uppercase">
                SURAT PERAKUAN SOKONGAN MENTOR BERTAULIAH
              </h4>
              <p className="text-xs font-semibold text-black mt-0.5">
                {selectedEndorsementForView.grantProgramTitle} ({selectedEndorsementForView.recommendedAmount})
              </p>
            </div>

            {/* Letter Body */}
            <div className="text-xs text-black space-y-3 leading-relaxed font-serif">
              <p>
                Dengan segala hormatnya dimaklumkan bahawa saya, <strong>{selectedEndorsementForView.mentorName}</strong>, 
                selaku Mentor Bertauliah di bawah <strong>{selectedEndorsementForView.mentorAgency}</strong> telah membimbing dan 
                menilai potensi perniagaan penama di bawah:
              </p>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-300 font-sans space-y-1 text-xs">
                <div><strong>Nama Usahawan Belia:</strong> {selectedEndorsementForView.menteeName}</div>
                <div><strong>Nama Syarikat / Jenama:</strong> {selectedEndorsementForView.businessName}</div>
                <div><strong>Kategori Perniagaan:</strong> {selectedEndorsementForView.businessCategory}</div>
                <div><strong>Jajahan Operasi:</strong> {selectedEndorsementForView.district}</div>
                <div><strong>Nilai Bantuan Diperakukan:</strong> <span className="font-bold text-black">{selectedEndorsementForView.recommendedAmount}</span></div>
              </div>

              <div className="space-y-1 font-sans">
                <strong className="text-black">Ulasan Justifikasi Mentor:</strong>
                <p className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 italic text-black leading-relaxed">
                  "{selectedEndorsementForView.justification}"
                </p>
              </div>

              <div className="space-y-1 font-sans">
                <strong className="text-black">Penilaian Tahap Kesediaan Operasi:</strong>
                <p className="text-black">
                  {selectedEndorsementForView.businessReadinessRemark}
                </p>
              </div>

              <p className="font-sans text-black">
                Sehubungan itu, pihak kami memperakui penuh permohonan ini untuk pertimbangan kelulusan dana geran oleh pihak urus setia.
              </p>
            </div>

            {/* Signature & Seal Block */}
            <div className="pt-6 border-t border-slate-300 flex flex-col sm:flex-row sm:items-end justify-between gap-4 font-sans text-xs">
              <div className="space-y-2">
                <div className="min-w-24 h-12 border-b-2 border-slate-800 flex items-end pb-1">
                  <span className="font-serif italic text-black font-bold text-sm">
                    {selectedEndorsementForView.mentorName
                      .replace(/^(Prof\.|Madya|Dr\.|Ts\.|En\.|Puan|Hj\.|Hjh\.)\s*/gi, '')
                      .trim()
                      .split(/\s+/)
                      .slice(0, 2)
                      .join(' ') || selectedEndorsementForView.mentorName}
                  </span>
                </div>
                <div>
                  <strong className="block text-black">{selectedEndorsementForView.mentorName}</strong>
                  <span className="text-black block">{selectedEndorsementForView.mentorDesignation || 'Mentor Bertauliah'}</span>
                  <span className="text-black/70 block">{selectedEndorsementForView.mentorAgency}</span>
                </div>
              </div>

              <div className="text-center sm:text-right">
                <div className="inline-block p-3 rounded-2xl bg-amber-50 border-2 border-amber-400 text-center">
                  <ShieldCheck className="w-7 h-7 text-black mx-auto mb-1" />
                  <span className="font-black text-[10px] text-black uppercase tracking-wider block">
                    PENGESAHAN DIGITAL UMK
                  </span>
                  <span className="font-mono text-[9px] text-black/70 block">
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
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-300 dark:border-slate-600 max-h-[92vh] overflow-y-auto overflow-hidden">
            
            <div className="kbelia-important-header px-6 sm:px-7 pt-6 pb-4 flex items-start justify-between gap-4 border-b border-slate-300 dark:border-slate-600">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 dark:bg-indigo-950/60 dark:border-indigo-800/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-black dark:text-white">
                    Tambah Rekod Sesi Bimbingan
                  </h3>
                  <p className="text-xs text-black/70 dark:text-white/75">
                    Simpan nota perbincangan dan senarai tugasan usahawan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewLogModalOpen(false)}
                className="p-1.5 rounded-lg text-black/70 dark:text-white/75 hover:text-black hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLogEntry} className="px-6 sm:px-7 pb-6 sm:pb-7 pt-4 space-y-3.5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-black dark:text-white mb-1">
                    Nama Usahawan Mentee:
                  </label>
                  <input
                    type="text"
                    required
                    value={newLogMenteeName}
                    onChange={(e) => setNewLogMenteeName(e.target.value)}
                    placeholder="Cth: Siti Aminah"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-black dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 dark:focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-black dark:text-white mb-1">
                    Nama Perniagaan:
                  </label>
                  <input
                    type="text"
                    required
                    value={newLogBusinessName}
                    onChange={(e) => setNewLogBusinessName(e.target.value)}
                    placeholder="Cth: Sambal Tok Abah"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-black dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 dark:focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-black dark:text-white mb-1">
                  Topik Bimbingan:
                </label>
                <input
                  type="text"
                  required
                  value={newLogTopic}
                  onChange={(e) => setNewLogTopic(e.target.value)}
                  placeholder="Cth: Penetapan Harga & Pemasaran TikTok Shop"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-black dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 dark:focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-black dark:text-white mb-1">
                  Minit & Ringkasan Perbincangan:
                </label>
                <textarea
                  required
                  rows={3}
                  value={newLogMinutes}
                  onChange={(e) => setNewLogMinutes(e.target.value)}
                  placeholder="Catatkan nasihat mentor, isu aliran tunai atau penemuan bimbingan..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-black dark:text-white font-sans leading-relaxed focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-emerald-600 dark:focus:border-blue-500"
                />
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-300 dark:border-slate-600">
                <label className="block text-xs font-bold text-black dark:text-white">
                  Tugasan Wajib Usahawan (Action Checklist):
                </label>
                
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newLogTask1}
                    onChange={(e) => setNewLogTask1(e.target.value)}
                    placeholder="Tugasan 1 (Cth: Buka akaun bank)"
                    className="col-span-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-black dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 dark:focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={newLogDueDate1}
                    onChange={(e) => setNewLogDueDate1(e.target.value)}
                    placeholder="Tarikh sasaran"
                    className="px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-black dark:text-white font-mono focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 dark:focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newLogTask2}
                    onChange={(e) => setNewLogTask2(e.target.value)}
                    placeholder="Tugasan 2 (Cth: Hantar borang SSM)"
                    className="col-span-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-black dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 dark:focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={newLogDueDate2}
                    onChange={(e) => setNewLogDueDate2(e.target.value)}
                    placeholder="Tarikh sasaran"
                    className="px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-black dark:text-white font-mono focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 dark:focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-300 dark:border-slate-600 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewLogModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-black dark:text-white/75 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm cursor-pointer dark:bg-blue-600"
                >
                  Simpan Rekod Sesi
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
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-300 dark:border-slate-600 max-h-[92vh] overflow-y-auto overflow-hidden">
            
            <div className="kbelia-important-header px-6 sm:px-7 pt-6 pb-4 flex items-start justify-between gap-4 border-b border-slate-300 dark:border-slate-600">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 dark:bg-indigo-950/60 dark:border-indigo-800/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-black dark:text-white">
                    Nota Nasihat & Tindakan Usahawan
                  </h3>
                  <p className="text-xs text-black/70 dark:text-white/75">
                    Untuk: <span className="font-bold text-black dark:text-white">{selectedMenteeForNotes.entrepreneurName}</span> ({selectedMenteeForNotes.businessName})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMenteeForNotes(null)}
                className="p-1.5 rounded-lg text-black/70 dark:text-white/75 hover:text-black hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNotes} className="px-6 sm:px-7 pb-6 sm:pb-7 pt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-black dark:text-white mb-1">
                  Senarai Langkah & Tindakan Usahawan:
                </label>
                <textarea
                  rows={4}
                  value={actionPlanInput}
                  onChange={(e) => setActionPlanInput(e.target.value)}
                  placeholder="Contoh:&#10;1. Sediakan 3 video promosi menu baharu sebelum 28 Mac.&#10;2. Buka akaun perniagaan khusus untuk elak campur duit peribadi.&#10;3. Hadiri bengkel pengurusan inventori UMK."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-black dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 leading-relaxed font-sans dark:focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-black dark:text-white mb-1">
                  Catatan Dalaman Mentor (Private Notes):
                </label>
                <textarea
                  rows={2}
                  value={mentorNotesInput}
                  onChange={(e) => setMentorNotesInput(e.target.value)}
                  placeholder="Catatan prestasi, komitmen usahawan atau cadangan susulan..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-black dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 dark:focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-black dark:text-white mb-1">
                  Pautan Google Meet / Maya (Pilihan):
                </label>
                <input
                  type="url"
                  value={meetLinkInput}
                  onChange={(e) => setMeetLinkInput(e.target.value)}
                  placeholder="https://meet.google.com/abc-defg-hij"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-black dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 dark:focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-300 dark:border-slate-600 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMenteeForNotes(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-black dark:text-white/75 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm flex items-center gap-1.5 cursor-pointer dark:bg-blue-600"
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
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-300 dark:border-slate-600 overflow-hidden">
            <div className="kbelia-important-header px-6 pt-5 pb-4 flex items-center justify-between border-b border-slate-300 dark:border-slate-600">
              <h3 className="font-bold text-sm text-black dark:text-white">
                Buka Slot Jadual Bimbingan Baharu
              </h3>
              <button onClick={() => setIsNewSlotModalOpen(false)} className="text-black/70 dark:text-white/75 hover:text-black cursor-pointer dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-black dark:text-white mb-1">
                  Tarikh Sesi:
                </label>
                <input
                  type="text"
                  value={newSlotDate}
                  onChange={(e) => setNewSlotDate(e.target.value)}
                  placeholder="Cth: 12 April 2026 (Ahad)"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-black dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 dark:focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-black dark:text-white mb-1">
                  Masa Sesi:
                </label>
                <input
                  type="text"
                  value={newSlotTime}
                  onChange={(e) => setNewSlotTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-black dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 dark:focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-black dark:text-white mb-1">
                  Mod Bimbingan:
                </label>
                <select
                  value={newSlotMode}
                  onChange={(e) => setNewSlotMode(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-black dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 dark:focus:border-blue-500"
                >
                  <option value="Bersemuka di Kampus">Bersemuka di Kampus (Bilik Bimbingan UMK)</option>
                  <option value="Google Meet Maya">Google Meet Maya</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-300 dark:border-slate-600 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewSlotModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-black dark:text-white/75 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsNewSlotModalOpen(false);
                    showToast('Slot bimbingan baharu berjaya diterbitkan untuk usahawan belia!');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm cursor-pointer dark:bg-teal-600"
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
        isAdminEditing={false}
        onSave={(updated) => {
          onUpdateMentor?.(updated);
          showToast('Profil mentor berjaya dikemas kini!');
        }}
      />

    </div>
  );
};
