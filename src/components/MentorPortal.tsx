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
  ArrowUpDown, 
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
  Trash2,
  ShieldCheck,
  XCircle,
  Printer,
  Download,
  Copy,
  Plus,
  ArrowRight,
  Sliders,
  FileCheck,
  BarChart3
} from 'lucide-react';
import { 
  MentorProfile, 
  MentorshipRegistration, 
  KelantanDistrict, 
  MentorSubTab, 
  GrantEndorsementLetter, 
  MentoringLogEntry,
  BusinessListing,
  PublishedMentorSlot,
  normalizeMentorshipMode
} from '../types';
import { ModernDatePicker, ModernTimePicker, toLocalIsoDate } from './ModernDateTimePicker';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import {
  deleteMentoringLogRecord,
  getDeletedIds,
  isProductionAuthenticated,
  saveGrantEndorsementRecord,
  saveMentoringLogRecord,
  saveMentorProfileRecord
} from '../services/dataService';
import {
  mergeUniqueById,
  subscribeCrossTabSync,
  subscribeDemoSyncCollection
} from '../services/realtimeSync';
import { openAndPrintDocument, generateMentorEndorsementOfficialHtml } from '../utils/printUtils';
import { downloadHtmlAsPdf } from '../utils/pdfGenerator';
import { useAuth } from '../context/AuthContext';
import { useConfirmDelete } from '../context/ConfirmDeleteContext';
import { useLanguage } from '../context/LanguageContext';
import { MentorProfileEditModal } from './MentorProfileEditModal';
import { emitAdminOrMentorNotification } from '../services/notificationStore';
import { showToast as triggerToast } from './ToastNotification';
import { SaaSKpiCard } from './SaaSKpiCard';
import { RoleDonutCard } from './RoleDonutCard';
import { AnimatedShimmerBar, AnimatedShimmerBarProps } from './AnimatedShimmerBar';
import { PortalImage } from './PortalImage';
import { PaginationBar, usePagination } from './PaginationBar';
import { ReferenceTableToolbar, RowActionMenu } from './ReferenceTableKit';
import { resolveMenteeVisuals } from '../utils/visualAssets';
import {
  DEFAULT_SORT_VALUE,
  ToolbarSortOption,
  buildStandardSortOptions,
  compareText,
  getModifiedTimestamp,
  getTimestampMs,
  parseNumericAmount,
  sortRecords
} from '../utils/sortUtils';
import { usePrefersReducedMotion } from '../hooks/useMotion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList
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
    endorsementCode: 'PERAKUAN-KBELIA-2026-8812',
    mentorId: 'mentor-1',
    mentorName: 'Prof. Madya Dr. Wan Azhar',
    mentorAgency: 'Hab Usahawan KBelia (Mentor Dalaman)',
    mentorDesignation: 'Ketua Penyelaras Bimbingan Usahawan Belia KBelia',
    menteeId: 'mentee-1',
    menteeName: 'Siti Aminah binti Yusof',
    menteePhone: '60112345678',
    businessName: 'Sambal Tok Abah Original',
    businessCategory: 'Makanan & Minuman (F&B)',
    district: 'Kota Bharu',
    recommendedAmount: 'RM3,000',
    grantProgramTitle: 'Geran Permulaan Usahawan Belia Kelantan (RM3,000)',
    justification: 'Usahawan menunjukkan komitmen tinggi dengan rekod jualan tunai konsisten melebihi RM4,200 sebulan. Penggunaan mesin retort pembungkusan akan memanjangkan jangka hayat sambal dan sedia dipasarkan di Kiosk Belia KB Sentral.',
    businessReadinessRemark: 'Telah menghadiri 3 sesi bimbingan penuh dan mematuhi piawaian pembungkusan label produk Hab Usahawan.',
    issuedAt: '2026-03-28',
    status: 'active',
    updatedAt: '2026-03-01T08:00:00.000Z'
  },
  {
    id: 'end-2',
    endorsementCode: 'PERAKUAN-KBELIA-2026-9043',
    mentorId: 'mentor-1',
    mentorName: 'Prof. Madya Dr. Wan Azhar',
    mentorAgency: 'Hab Usahawan KBelia (Mentor Dalaman)',
    mentorDesignation: 'Ketua Penyelaras Bimbingan Usahawan Belia KBelia',
    menteeId: 'mentee-2',
    menteeName: 'Muhammad Farhan bin Zulkifli',
    menteePhone: '60198765432',
    businessName: 'Kelantan Tech Solution',
    businessCategory: 'Teknologi & Servis Digital',
    district: 'Bachok',
    recommendedAmount: 'RM5,000',
    grantProgramTitle: 'Geran Pemangkin Usahawan Belia Kelantan (RM5,000)',
    justification: 'Inovasi sistem POS dan inventori awan yang dibangunkan telah diuji oleh 5 peniaga kapsul niaga Hab Usahawan dengan maklum balas positif. Geran disyorkan bagi menaik taraf server awan dan perlesenan keselamatan.',
    businessReadinessRemark: 'Model Ruang Niaga yang mampan dengan unjuran pulangan modal dalam tempoh 4 bulan.',
    issuedAt: '2026-04-02',
    status: 'active',
    updatedAt: '2026-03-01T08:00:00.000Z'
  },
  {
    id: 'end-3',
    endorsementCode: 'PERAKUAN-KBELIA-2026-7734',
    mentorId: 'mentor-1',
    mentorName: 'Prof. Madya Dr. Wan Azhar',
    mentorAgency: 'Hab Usahawan KBelia (Mentor Dalaman)',
    mentorDesignation: 'Ketua Penyelaras Bimbingan Usahawan Belia KBelia',
    menteeId: 'mentee-3',
    menteeName: 'Nurul Izzah binti Razak',
    menteePhone: '60133445566',
    businessName: 'Songket Warisan Cik Siti',
    businessCategory: 'Fesyen, Batik & Kraf Kelantan',
    district: 'Pasir Mas',
    recommendedAmount: 'RM5,000',
    grantProgramTitle: 'Geran Pemangkin Usahawan Belia Kelantan (RM5,000)',
    justification: 'Mempunyai keunikan rekaan moden kontemporari yang menarik minat pasaran belia dan pelancong. Dana diperlukan bagi pembelian benang emas berkualiti tinggi dan pemasaran video digital berpusat.',
    businessReadinessRemark: 'Dokumen pendaftaran perniagaan dan penyata akaun bank syarikat lengkap dan teratur.',
    issuedAt: '2026-04-06',
    status: 'active',
    updatedAt: '2026-03-01T08:00:00.000Z'
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
    minutes: 'Membincangkan peralihan daripada balang kaca biasa kepada pouch retort tahan suhu tinggi. Usahawan dinasihatkan menambah maklumat tarikh luput, kod bar dan penandaan piawaian keselamatan makanan pada label baharu.',
    actionItems: [
      { id: 'act-1', task: 'Dapatkan sebut harga mesin pouch retort dari rakan pembekal industri', completed: true, dueDate: '2026-03-30' },
      { id: 'act-2', task: 'Ubah suai grafik label mengikut garis panduan keselamatan makanan', completed: true, dueDate: '2026-04-05' },
      { id: 'act-3', task: 'Hantar 5 sampel untuk ujian ketahanan haba di makmal ujian keselamatan makanan', completed: false, dueDate: '2026-04-15' }
    ],
    createdAt: '2026-03-25T14:30:00Z',
    updatedAt: '2026-03-01T08:00:00.000Z'
  },
  {
    id: 'log-2',
    mentorId: 'mentor-1',
    menteeName: 'Muhammad Farhan bin Zulkifli',
    businessName: 'Kelantan Tech Solution',
    sessionDate: '2026-04-01',
    topic: 'Pengurusan Aliran Tunai & Pemisahan Akaun Bank Perniagaan',
    minutes: 'Meneliti buku tunai syarikat. Didapati usahawan masih menggabungkan wang tunai peribadi dengan hasil langganan perisian. Prosedur perakaunan asas telah dirangka bersama mentor.',
    actionItems: [
      { id: 'act-4', task: 'Buka akaun semasa perniagaan berasingan atas nama Kelantan Tech Solution', completed: true, dueDate: '2026-04-04' },
      { id: 'act-5', task: 'Aktifkan integrasi QR pembayaran digital khusus bisnes untuk terimaan yuran langganan', completed: false, dueDate: '2026-04-10' }
    ],
    createdAt: '2026-04-01T11:00:00Z',
    updatedAt: '2026-03-01T08:00:00.000Z'
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
      { id: 'act-7', task: 'Jalankan sesi ujian rasa (blind taste test) bersama 20 pelanggan komuniti setempat', completed: false, dueDate: '2026-04-14' }
    ],
    createdAt: '2026-04-05T16:00:00Z',
    updatedAt: '2026-03-01T08:00:00.000Z'
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
  const { confirmDelete } = useConfirmDelete();
  const { language } = useLanguage();
  const isEn = language === 'en';
  const prefersReducedMotion = usePrefersReducedMotion();
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
    let demoDeletedEnds: string[] = [];
    let prodLogs: MentoringLogEntry[] = [];
    let demoSyncLogs: MentoringLogEntry[] = [];
    let demoDeletedLogs: string[] = [];

    const recomputeMentorData = () => {
      const baseDeleted = getDeletedIds();
      const localEnds = readLocalList<GrantEndorsementLetter>('kbelia_mentor_endorsements_v1', INITIAL_ENDORSEMENTS);
      const localLogs = readLocalList<MentoringLogEntry>('kbelia_mentor_logs_v1', INITIAL_LOGS);

      const mergedEnds = mergeUniqueById<GrantEndorsementLetter>(
        prodAuth
          ? [prodEndorsements, demoSyncEndorsements, localEnds, INITIAL_ENDORSEMENTS]
          : [demoSyncEndorsements, localEnds, INITIAL_ENDORSEMENTS],
        [...baseDeleted, ...demoDeletedEnds]
      );
      mergedEnds.sort((a, b) => (b.issuedAt || '').localeCompare(a.issuedAt || ''));
      setEndorsements(mergedEnds.filter(e => e.mentorId === currentMentor.id));

      const mergedLogs = mergeUniqueById<MentoringLogEntry>(
        prodAuth
          ? [prodLogs, demoSyncLogs, localLogs, INITIAL_LOGS]
          : [demoSyncLogs, localLogs, INITIAL_LOGS],
        [...baseDeleted, ...demoDeletedLogs]
      );
      mergedLogs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setLogEntries(mergedLogs.filter(l => l.mentorId === currentMentor.id));
    };

    recomputeMentorData();

    const unsubCrossTab = subscribeCrossTabSync((entity) => {
      if (['all', 'endorsement', 'log', 'deleted'].includes(entity)) {
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

    const unsubDemoEnds = subscribeDemoSyncCollection<GrantEndorsementLetter>('endorsement', (items, delIds) => {
      demoSyncEndorsements = items;
      demoDeletedEnds = delIds;
      recomputeMentorData();
    });

    const unsubDemoLogs = subscribeDemoSyncCollection<MentoringLogEntry>('log', (items, delIds) => {
      demoSyncLogs = items;
      demoDeletedLogs = delIds;
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

  // Filters & sorting for MentorPortal tables
  const [overviewSearch, setOverviewSearch] = useState('');
  const [overviewStatusFilter, setOverviewStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all');
  const [overviewDistrictFilter, setOverviewDistrictFilter] = useState<'all' | KelantanDistrict>('all');
  const [overviewSortBy, setOverviewSortBy] = useState<'status' | 'name' | 'district'>('status');
  const [overviewSortDir, setOverviewSortDir] = useState<'asc' | 'desc'>('asc');
  const [overviewSortPreset, setOverviewSortPreset] = useState<string>(DEFAULT_SORT_VALUE);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [modeFilter, setModeFilter] = useState<'all' | 'Bersemuka di Kampus' | 'Google Meet'>('all');
  const [applicationsSortBy, setApplicationsSortBy] = useState<'status' | 'name' | 'date'>('status');
  const [applicationsSortDir, setApplicationsSortDir] = useState<'asc' | 'desc'>('asc');
  const [applicationsSortPreset, setApplicationsSortPreset] = useState<string>(DEFAULT_SORT_VALUE);

  const [scheduleSearch, setScheduleSearch] = useState('');
  const [scheduleModeFilter, setScheduleModeFilter] = useState<'all' | 'Bersemuka di Kampus' | 'Google Meet'>('all');
  const [scheduleSortBy, setScheduleSortBy] = useState<'date' | 'name'>('date');
  const [scheduleSortDir, setScheduleSortDir] = useState<'asc' | 'desc'>('asc');
  const [scheduleSortPreset, setScheduleSortPreset] = useState<string>(DEFAULT_SORT_VALUE);

  const [actionPlansSearch, setActionPlansSearch] = useState('');
  const [actionPlansDistrictFilter, setActionPlansDistrictFilter] = useState<'all' | KelantanDistrict>('all');
  const [actionPlansSortBy, setActionPlansSortBy] = useState<'name' | 'topic'>('name');
  const [actionPlansSortDir, setActionPlansSortDir] = useState<'asc' | 'desc'>('asc');
  const [actionPlansSortPreset, setActionPlansSortPreset] = useState<string>(DEFAULT_SORT_VALUE);

  const [endorsementsSearch, setEndorsementsSearch] = useState('');
  const [endorsementsGrantFilter, setEndorsementsGrantFilter] = useState<'all' | 'RM3,000' | 'RM5,000' | 'RM10,000'>('all');
  const [endorsementsSortBy, setEndorsementsSortBy] = useState<'date' | 'name'>('date');
  const [endorsementsSortDir, setEndorsementsSortDir] = useState<'asc' | 'desc'>('desc');
  const [endorsementsSortPreset, setEndorsementsSortPreset] = useState<string>(DEFAULT_SORT_VALUE);

  const [logsSearch, setLogsSearch] = useState('');
  const [logsStatusFilter, setLogsStatusFilter] = useState<'all' | 'done' | 'pending'>('all');
  const [logsSortBy, setLogsSortBy] = useState<'date' | 'name'>('date');
  const [logsSortDir, setLogsSortDir] = useState<'asc' | 'desc'>('desc');
  const [logsSortPreset, setLogsSortPreset] = useState<string>(DEFAULT_SORT_VALUE);

  const overviewSortOptions: ToolbarSortOption[] = buildStandardSortOptions([
    { value: 'status_pending', label: 'Status (Menunggu Dahulu)' },
    { value: 'district_asc', label: 'Daerah (A - Z)' },
    { value: 'topic_asc', label: 'Topik Bimbingan (A - Z)' }
  ]);

  const applicationsSortOptions: ToolbarSortOption[] = buildStandardSortOptions([
    { value: 'status_pending', label: 'Status (Menunggu Dahulu)' },
    { value: 'session_date_asc', label: 'Tarikh Sesi (Terawal)' },
    { value: 'district_asc', label: 'Daerah (A - Z)' }
  ]);

  const scheduleSortOptions: ToolbarSortOption[] = buildStandardSortOptions([
    { value: 'session_date_asc', label: 'Tarikh Sesi (Terawal)' },
    { value: 'session_date_desc', label: 'Tarikh Sesi (Terakhir)' },
    { value: 'district_asc', label: 'Daerah (A - Z)' }
  ]);

  const actionPlansSortOptions: ToolbarSortOption[] = buildStandardSortOptions([
    { value: 'topic_asc', label: 'Topik Bimbingan (A - Z)' },
    { value: 'district_asc', label: 'Daerah (A - Z)' }
  ]);

  const endorsementsSortOptions: ToolbarSortOption[] = buildStandardSortOptions([
    { value: 'amount_desc', label: 'Jumlah Geran (Tertinggi)' },
    { value: 'district_asc', label: 'Daerah (A - Z)' }
  ]);

  const logsSortOptions: ToolbarSortOption[] = buildStandardSortOptions([
    { value: 'session_desc', label: 'Tarikh Sesi (Terbaru)' },
    { value: 'progress_asc', label: 'Tugasan Belum Selesai Dahulu' },
    { value: 'topic_asc', label: 'Topik Bimbingan (A - Z)' }
  ]);

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
  const [newSlotMode, setNewSlotMode] = useState<'Bersemuka di Kampus' | 'Google Meet'>('Bersemuka di Kampus');

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

  // Logbook Entry Modal (Create & Edit with dynamic task list)
  const createEmptyTaskDraft = (seedIndex = 0) => ({
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${seedIndex}`,
    task: '',
    dueDate: '',
    completed: false
  });
  const [isNewLogModalOpen, setIsNewLogModalOpen] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [newLogMenteeName, setNewLogMenteeName] = useState('');
  const [newLogBusinessName, setNewLogBusinessName] = useState('');
  const [newLogSessionDate, setNewLogSessionDate] = useState(() => toLocalIsoDate(new Date()));
  const [newLogTopic, setNewLogTopic] = useState('');
  const [newLogMinutes, setNewLogMinutes] = useState('');
  const [newLogTasks, setNewLogTasks] = useState<{ id: string; task: string; dueDate: string; completed: boolean }[]>(() => [
    createEmptyTaskDraft(1),
    createEmptyTaskDraft(2)
  ]);

  // Inline task editing & quick-add state in expanded logbook checklist
  const [editingInlineTask, setEditingInlineTask] = useState<{
    logId: string;
    taskId: string;
    task: string;
    dueDate: string;
  } | null>(null);
  const [inlineNewTaskDrafts, setInlineNewTaskDrafts] = useState<
    Record<string, { isOpen: boolean; task: string; dueDate: string }>
  >({});

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

  const uniqueMentorDistricts = Array.from(
    new Set(mentorRegistrations.map(r => r.district).filter(Boolean))
  ).sort() as KelantanDistrict[];

  // Overview table: matches search + filter + sort
  const baseOverviewRegistrations = mentorRegistrations.filter(r => {
    if (overviewStatusFilter !== 'all' && r.status !== overviewStatusFilter) return false;
    if (overviewDistrictFilter !== 'all' && r.district !== overviewDistrictFilter) return false;
    const q = overviewSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      r.entrepreneurName.toLowerCase().includes(q) ||
      r.businessName.toLowerCase().includes(q) ||
      r.topic.toLowerCase().includes(q) ||
      r.district.toLowerCase().includes(q)
    );
  });

  const overviewRegistrations =
    overviewSortPreset === 'table_column'
      ? [...baseOverviewRegistrations].sort((a, b) => {
          let cmp = 0;
          if (overviewSortBy === 'name') cmp = a.entrepreneurName.localeCompare(b.entrepreneurName);
          else if (overviewSortBy === 'district') cmp = a.district.localeCompare(b.district);
          else cmp = statusOrderWeight(a.status) - statusOrderWeight(b.status);
          return overviewSortDir === 'asc' ? cmp : -cmp;
        })
      : sortRecords(baseOverviewRegistrations, {
          sortBy: overviewSortPreset,
          getName: (r) => `${r.entrepreneurName || ''} ${r.businessName || ''}`.trim(),
          customCompare: (a, b, mode) => {
            if (mode === 'status_pending') return statusOrderWeight(a.status) - statusOrderWeight(b.status);
            if (mode === 'district_asc') return compareText(a.district, b.district);
            if (mode === 'topic_asc') return compareText(a.topic, b.topic);
            return null;
          }
        });

  // Permohonan Bimbingan: 'all' shows active (pending + confirmed); 'completed' shows completed
  const baseFilteredRegistrations = mentorRegistrations.filter(r => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      r.entrepreneurName.toLowerCase().includes(q) ||
      r.businessName.toLowerCase().includes(q) ||
      r.topic.toLowerCase().includes(q) ||
      r.district.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'all'
        ? r.status === 'pending' || r.status === 'confirmed'
        : r.status === statusFilter;
    const matchesMode = modeFilter === 'all' || normalizeMentorshipMode(r.mode) === modeFilter;

    return matchesSearch && matchesStatus && matchesMode;
  });

  const filteredRegistrations =
    applicationsSortPreset === 'table_column'
      ? [...baseFilteredRegistrations].sort((a, b) => {
          let cmp = 0;
          if (applicationsSortBy === 'name') cmp = a.entrepreneurName.localeCompare(b.entrepreneurName);
          else if (applicationsSortBy === 'date') cmp = (a.preferredDate || '').localeCompare(b.preferredDate || '');
          else cmp = statusOrderWeight(a.status) - statusOrderWeight(b.status);
          return applicationsSortDir === 'asc' ? cmp : -cmp;
        })
      : sortRecords(baseFilteredRegistrations, {
          sortBy: applicationsSortPreset,
          getName: (r) => `${r.entrepreneurName || ''} ${r.businessName || ''}`.trim(),
          customCompare: (a, b, mode) => {
            if (mode === 'status_pending') return statusOrderWeight(a.status) - statusOrderWeight(b.status);
            if (mode === 'session_date_asc') return getTimestampMs(a.preferredDate) - getTimestampMs(b.preferredDate);
            if (mode === 'district_asc') return compareText(a.district, b.district);
            return null;
          }
        });

  const confirmedScheduleSessions = mentorRegistrations.filter(m => m.status === 'confirmed');
  const baseScheduleSessions = confirmedScheduleSessions.filter(m => {
    const inferredMode = m.meetingLink ? 'Google Meet' : normalizeMentorshipMode(m.mode);
    if (scheduleModeFilter !== 'all' && inferredMode !== scheduleModeFilter) {
      return false;
    }
    const q = scheduleSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      m.entrepreneurName.toLowerCase().includes(q) ||
      m.businessName.toLowerCase().includes(q) ||
      m.topic.toLowerCase().includes(q) ||
      (m.preferredDate || '').toLowerCase().includes(q)
    );
  });

  const filteredScheduleSessions =
    scheduleSortPreset === 'table_column'
      ? [...baseScheduleSessions].sort((a, b) => {
          const cmp =
            scheduleSortBy === 'name'
              ? a.entrepreneurName.localeCompare(b.entrepreneurName)
              : (a.preferredDate || '').localeCompare(b.preferredDate || '');
          return scheduleSortDir === 'asc' ? cmp : -cmp;
        })
      : sortRecords(baseScheduleSessions, {
          sortBy: scheduleSortPreset,
          getName: (m) => `${m.entrepreneurName || ''} ${m.businessName || ''}`.trim(),
          customCompare: (a, b, mode) => {
            if (mode === 'session_date_asc') return getTimestampMs(a.preferredDate) - getTimestampMs(b.preferredDate);
            if (mode === 'session_date_desc') return getTimestampMs(b.preferredDate) - getTimestampMs(a.preferredDate);
            if (mode === 'district_asc') return compareText(a.district, b.district);
            return null;
          }
        });

  const actionPlanMentees = mentorRegistrations.filter(m => Boolean(m.mentorActionPlan));
  const baseActionPlanMentees = actionPlanMentees.filter(m => {
    if (actionPlansDistrictFilter !== 'all' && m.district !== actionPlansDistrictFilter) return false;
    const q = actionPlansSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      m.entrepreneurName.toLowerCase().includes(q) ||
      m.businessName.toLowerCase().includes(q) ||
      m.topic.toLowerCase().includes(q) ||
      (m.mentorActionPlan || '').toLowerCase().includes(q)
    );
  });

  const filteredActionPlanMentees =
    actionPlansSortPreset === 'table_column'
      ? [...baseActionPlanMentees].sort((a, b) => {
          const cmp =
            actionPlansSortBy === 'topic'
              ? a.topic.localeCompare(b.topic)
              : a.entrepreneurName.localeCompare(b.entrepreneurName);
          return actionPlansSortDir === 'asc' ? cmp : -cmp;
        })
      : sortRecords(baseActionPlanMentees, {
          sortBy: actionPlansSortPreset,
          getName: (m) => `${m.entrepreneurName || ''} ${m.businessName || ''}`.trim(),
          customCompare: (a, b, mode) => {
            if (mode === 'topic_asc') return compareText(a.topic, b.topic);
            if (mode === 'district_asc') return compareText(a.district, b.district);
            return null;
          }
        });

  const baseEndorsements = mentorEndorsements.filter(e => {
    if (endorsementsGrantFilter !== 'all' && e.recommendedAmount !== endorsementsGrantFilter) return false;
    const q = endorsementsSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      e.menteeName.toLowerCase().includes(q) ||
      e.businessName.toLowerCase().includes(q) ||
      e.endorsementCode.toLowerCase().includes(q) ||
      e.district.toLowerCase().includes(q)
    );
  });

  const filteredEndorsements =
    endorsementsSortPreset === 'table_column'
      ? [...baseEndorsements].sort((a, b) => {
          const cmp =
            endorsementsSortBy === 'name'
              ? a.menteeName.localeCompare(b.menteeName)
              : (a.issuedAt || '').localeCompare(b.issuedAt || '');
          return endorsementsSortDir === 'asc' ? cmp : -cmp;
        })
      : sortRecords(baseEndorsements, {
          sortBy: endorsementsSortPreset,
          getName: (e) => `${e.menteeName || ''} ${e.businessName || ''}`.trim(),
          getModified: (e) => getModifiedTimestamp(e) || getTimestampMs(e.issuedAt),
          customCompare: (a, b, mode) => {
            if (mode === 'amount_desc') return parseNumericAmount(b.recommendedAmount) - parseNumericAmount(a.recommendedAmount);
            if (mode === 'district_asc') return compareText(a.district, b.district);
            return null;
          }
        });

  const baseLogs = mentorLogs.filter(l => {
    const totalTasks = l.actionItems?.length || 0;
    const doneTasks = l.actionItems?.filter(a => a.completed).length || 0;
    const allDone = totalTasks > 0 && doneTasks === totalTasks;
    if (logsStatusFilter === 'done' && !allDone) return false;
    if (logsStatusFilter === 'pending' && allDone) return false;
    const q = logsSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      l.menteeName.toLowerCase().includes(q) ||
      l.businessName.toLowerCase().includes(q) ||
      l.topic.toLowerCase().includes(q) ||
      l.sessionDate.toLowerCase().includes(q)
    );
  });

  const filteredLogs =
    logsSortPreset === 'table_column'
      ? [...baseLogs].sort((a, b) => {
          const cmp =
            logsSortBy === 'name'
              ? a.menteeName.localeCompare(b.menteeName)
              : (a.sessionDate || '').localeCompare(b.sessionDate || '');
          return logsSortDir === 'asc' ? cmp : -cmp;
        })
      : sortRecords(baseLogs, {
          sortBy: logsSortPreset,
          getName: (l) => `${l.menteeName || ''} ${l.businessName || ''}`.trim(),
          getModified: (l) => getModifiedTimestamp(l) || getTimestampMs(l.sessionDate),
          customCompare: (a, b, mode) => {
            if (mode === 'session_desc') return getTimestampMs(b.sessionDate) - getTimestampMs(a.sessionDate);
            if (mode === 'progress_asc') {
              const aPending = (a.actionItems?.filter(i => !i.completed).length || 0);
              const bPending = (b.actionItems?.filter(i => !i.completed).length || 0);
              return bPending - aPending;
            }
            if (mode === 'topic_asc') return compareText(a.topic, b.topic);
            return null;
          }
        });

  // Calculate statistics for this mentor
  const totalMentees = mentorRegistrations.length;
  const activeCount = mentorRegistrations.filter(r => r.status === 'pending' || r.status === 'confirmed').length;
  const pendingCount = mentorRegistrations.filter(r => r.status === 'pending').length;
  const confirmedCount = confirmedScheduleSessions.length;
  const completedCount = mentorRegistrations.filter(r => r.status === 'completed').length;
  const totalEndorsementsCount = mentorEndorsements.length;
  const totalLogbookCount = mentorLogs.length;

  // Unconditional 7-item pagination hooks across MentorPortal lists
  const overviewPagination = usePagination(overviewRegistrations, 7, [overviewSearch, overviewStatusFilter, overviewDistrictFilter, overviewSortPreset, overviewSortBy, overviewSortDir, currentMentor.id]);
  const applicationsPagination = usePagination(filteredRegistrations, 7, [searchQuery, statusFilter, modeFilter, applicationsSortPreset, applicationsSortBy, applicationsSortDir, currentMentor.id]);
  const schedulePagination = usePagination(filteredScheduleSessions, 7, [scheduleSearch, scheduleModeFilter, scheduleSortPreset, scheduleSortBy, scheduleSortDir, currentMentor.id, filteredScheduleSessions.length]);
  const actionPlansPagination = usePagination(filteredActionPlanMentees, 7, [actionPlansSearch, actionPlansDistrictFilter, actionPlansSortPreset, actionPlansSortBy, actionPlansSortDir, currentMentor.id, filteredActionPlanMentees.length]);
  const endorsementsPagination = usePagination(filteredEndorsements, 7, [endorsementsSearch, endorsementsGrantFilter, endorsementsSortPreset, endorsementsSortBy, endorsementsSortDir, currentMentor.id, filteredEndorsements.length]);
  const logsPagination = usePagination(filteredLogs, 7, [logsSearch, logsStatusFilter, logsSortPreset, logsSortBy, logsSortDir, currentMentor.id, filteredLogs.length]);

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

  const getPlusDaysIso = (offsetDays: number) => {
    const dt = new Date();
    dt.setDate(dt.getDate() + offsetDays);
    return toLocalIsoDate(dt);
  };

  const persistUpdatedLogEntry = (
    logId: string,
    updater: (log: MentoringLogEntry) => MentoringLogEntry,
    toastMessage: string
  ) => {
    let targetUpdatedLog: MentoringLogEntry | null = null;
    const updated = logEntries.map(log => {
      if (log.id !== logId || log.mentorId !== currentMentor.id) return log;
      targetUpdatedLog = updater(log);
      return targetUpdatedLog;
    });
    saveLogEntries(updated);
    if (targetUpdatedLog) {
      void saveMentoringLogRecord(targetUpdatedLog).catch(console.error);
    }
    showToast(toastMessage);
  };

  // Toggle logbook task completion
  const handleToggleLogTask = (logId: string, taskId: string) => {
    persistUpdatedLogEntry(
      logId,
      (log) => ({
        ...log,
        updatedAt: new Date().toISOString(),
        actionItems: (log.actionItems || []).map(task =>
          task.id === taskId ? { ...task, completed: !task.completed } : task
        )
      }),
      'Status semakan tugasan usahawan dikemaskini!'
    );
  };

  const handleStartInlineTaskEdit = (
    logId: string,
    task: { id: string; task: string; dueDate: string }
  ) => {
    setEditingInlineTask({
      logId,
      taskId: task.id,
      task: task.task,
      dueDate: task.dueDate || ''
    });
  };

  const handleSaveInlineTaskEdit = () => {
    if (!editingInlineTask) return;
    const trimmedTask = editingInlineTask.task.trim();
    if (!trimmedTask) {
      triggerToast('Sila masukkan penerangan tugasan sebelum menyimpan.', 'error');
      return;
    }
    const { logId, taskId, dueDate } = editingInlineTask;
    persistUpdatedLogEntry(
      logId,
      (log) => ({
        ...log,
        updatedAt: new Date().toISOString(),
        actionItems: (log.actionItems || []).map(item =>
          item.id === taskId
            ? { ...item, task: trimmedTask, dueDate: dueDate || item.dueDate || getPlusDaysIso(7) }
            : item
        )
      }),
      'Tugasan berjaya dikemaskini!'
    );
    setEditingInlineTask(null);
  };

  const handleDeleteInlineTask = (logId: string, taskId: string) => {
    if (editingInlineTask?.logId === logId && editingInlineTask?.taskId === taskId) {
      setEditingInlineTask(null);
    }
    persistUpdatedLogEntry(
      logId,
      (log) => ({
        ...log,
        updatedAt: new Date().toISOString(),
        actionItems: (log.actionItems || []).filter(item => item.id !== taskId)
      }),
      'Tugasan berjaya dipadam.'
    );
  };

  const handleOpenInlineNewTask = (logId: string) => {
    setInlineNewTaskDrafts(prev => ({
      ...prev,
      [logId]: {
        isOpen: true,
        task: prev[logId]?.task || '',
        dueDate: prev[logId]?.dueDate || ''
      }
    }));
  };

  const handleSaveInlineNewTask = (logId: string) => {
    const draft = inlineNewTaskDrafts[logId];
    const trimmedTask = draft?.task.trim() || '';
    if (!trimmedTask) {
      triggerToast('Sila masukkan penerangan tugasan baharu.', 'error');
      return;
    }
    const targetLog = logEntries.find(l => l.id === logId && l.mentorId === currentMentor.id);
    if (targetLog && (targetLog.actionItems?.length || 0) >= 30) {
      triggerToast('Maksimum 30 tugasan bagi setiap rekod sesi telah dicapai.', 'warning');
      return;
    }
    const newTaskItem = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      task: trimmedTask,
      completed: false,
      dueDate: draft?.dueDate || getPlusDaysIso(7)
    };
    persistUpdatedLogEntry(
      logId,
      (log) => ({
        ...log,
        updatedAt: new Date().toISOString(),
        actionItems: [...(log.actionItems || []), newTaskItem]
      }),
      'Tugasan baharu berjaya ditambah!'
    );
    setInlineNewTaskDrafts(prev => ({
      ...prev,
      [logId]: { isOpen: false, task: '', dueDate: '' }
    }));
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

    const currentYear = new Date().getFullYear();
    const uniqueCode = `PERAKUAN-KBELIA-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`;
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
      businessReadinessRemark: newEndorsementReadiness || 'Telah dinilai secara profesional dalam sesi bimbingan mentor Hab Usahawan.',
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

  const openCreateLogModal = () => {
    setEditingLogId(null);
    setNewLogMenteeName('');
    setNewLogBusinessName('');
    setNewLogSessionDate(toLocalIsoDate(new Date()));
    setNewLogTopic('');
    setNewLogMinutes('');
    setNewLogTasks([createEmptyTaskDraft(1), createEmptyTaskDraft(2)]);
    setIsNewLogModalOpen(true);
  };

  const openEditLogModal = (log: MentoringLogEntry) => {
    setEditingLogId(log.id);
    setNewLogMenteeName(log.menteeName || '');
    setNewLogBusinessName(log.businessName || '');
    setNewLogSessionDate(log.sessionDate || toLocalIsoDate(new Date()));
    setNewLogTopic(log.topic || '');
    setNewLogMinutes(log.minutes || '');
    setNewLogTasks(
      log.actionItems && log.actionItems.length > 0
        ? log.actionItems.map((item) => ({
            id: item.id,
            task: item.task,
            dueDate: item.dueDate || '',
            completed: Boolean(item.completed)
          }))
        : [createEmptyTaskDraft(1)]
    );
    setIsNewLogModalOpen(true);
  };

  const handleAddModalTaskRow = () => {
    if (newLogTasks.length >= 30) {
      triggerToast('Maksimum 30 tugasan bagi setiap rekod sesi telah dicapai.', 'warning');
      return;
    }
    setNewLogTasks(prev => [...prev, createEmptyTaskDraft(prev.length + 1)]);
  };

  const handleUpdateModalTaskRow = (
    taskId: string,
    patch: Partial<{ task: string; dueDate: string; completed: boolean }>
  ) => {
    setNewLogTasks(prev =>
      prev.map(item => (item.id === taskId ? { ...item, ...patch } : item))
    );
  };

  const handleRemoveModalTaskRow = (taskId: string) => {
    setNewLogTasks(prev => prev.filter(item => item.id !== taskId));
  };

  // Create or Update Logbook Entry
  const handleSaveLogEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogMenteeName.trim() || !newLogBusinessName.trim() || !newLogTopic.trim() || !newLogMinutes.trim()) {
      triggerToast('Sila isi nama mentee, bisnes, topik dan minit bimbingan.', 'error');
      return;
    }

    const actions = newLogTasks
      .filter(item => item.task.trim().length > 0)
      .slice(0, 30)
      .map((item, index) => ({
        id: item.id || `act-${Date.now()}-${index + 1}`,
        task: item.task.trim(),
        completed: Boolean(item.completed),
        dueDate: item.dueDate || getPlusDaysIso((index + 1) * 7)
      }));

    if (editingLogId) {
      let updatedEntry: MentoringLogEntry | null = null;
      const updatedList = logEntries.map(log => {
        if (log.id !== editingLogId || log.mentorId !== currentMentor.id) return log;
        updatedEntry = {
          ...log,
          menteeName: newLogMenteeName.trim(),
          businessName: newLogBusinessName.trim(),
          sessionDate: newLogSessionDate || log.sessionDate || toLocalIsoDate(new Date()),
          topic: newLogTopic.trim(),
          minutes: newLogMinutes.trim(),
          actionItems: actions,
          updatedAt: new Date().toISOString()
        };
        return updatedEntry;
      });
      saveLogEntries(updatedList);
      if (updatedEntry) {
        void saveMentoringLogRecord(updatedEntry).catch(console.error);
      }
      setExpandedLogIds(prev => ({ ...prev, [editingLogId]: true }));
      setIsNewLogModalOpen(false);
      setEditingLogId(null);
      showToast('Rekod sesi bimbingan & tugasan berjaya dikemaskini!');
      return;
    }

    const nowIso = new Date().toISOString();
    const newEntry: MentoringLogEntry = {
      id: `log-${Date.now()}`,
      mentorId: currentMentor.id,
      menteeName: newLogMenteeName.trim(),
      businessName: newLogBusinessName.trim(),
      sessionDate: newLogSessionDate || toLocalIsoDate(new Date()),
      topic: newLogTopic.trim(),
      minutes: newLogMinutes.trim(),
      actionItems: actions,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    saveLogEntries([newEntry, ...logEntries]);
    void saveMentoringLogRecord(newEntry).catch(console.error);
    setExpandedLogIds(prev => ({ ...prev, [newEntry.id]: true }));
    setIsNewLogModalOpen(false);
    showToast('Rekod sesi bimbingan berjaya disimpan!');
  };

  const handleDeleteLogEntry = (log: MentoringLogEntry) => {
    confirmDelete({
      title: 'Padam Rekod Sesi Bimbingan?',
      itemName: `${log.menteeName} - ${log.topic}`,
      itemType: 'Rekod Sesi Mentor',
      description: 'Semua minit perbincangan dan senarai tugasan di bawah rekod sesi ini akan dipadamkan secara kekal.',
      confirmLabel: 'Padam Rekod',
      onConfirm: async () => {
        saveLogEntries(logEntries.filter(item => item.id !== log.id));
        if (editingInlineTask?.logId === log.id) {
          setEditingInlineTask(null);
        }
        setInlineNewTaskDrafts(prev => {
          const next = { ...prev };
          delete next[log.id];
          return next;
        });
        await deleteMentoringLogRecord(log.id);
        showToast('Rekod sesi bimbingan berjaya dipadam.');
      }
    });
  };

  // Security Barrier: Strictly Mentor ONLY (Zero Cross-Portal Access)
  if (!isMentor) {
    return (
      <div className="py-8 px-2 sm:px-4 w-full animate-in fade-in duration-300">
        <div className="bg-white dark:bg-slate-800 text-black dark:text-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-300 dark:border-slate-600 relative overflow-hidden text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800/70 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="max-w-xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.8125rem] font-extrabold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/60 text-black dark:text-white border border-rose-200 dark:border-rose-800/70">
              <ShieldCheck className="w-3.5 h-3.5" />
              Akses Eksklusif Peranan Mentor
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-black dark:text-white tracking-tight">
              Portal Pengurusan Mentor
            </h2>
            <p className="text-[0.9375rem] text-black dark:text-white leading-relaxed">
              Bahagian ini dikhaskan untuk <strong>Mentor Dalaman &amp; Pakar Industri Berdaftar</strong> sahaja bagi menguruskan sesi bimbingan usahawan seliaan sendiri, mengeluarkan <strong>Surat Sokongan Geran Belia</strong>, dan mencatat rekod sesi serta tugasan. Modul ini diasingkan sepenuhnya daripada fungsi usahawan mahupun pentadbir sistem.
            </p>
          </div>

          {/* Action button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => openLoginModal('mentor')}
              className="w-full sm:w-auto px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer dark:bg-teal-600"
            >
              <GraduationCap className="w-4 h-4 text-white" />
              <span>Log Masuk</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3.5 animate-in fade-in duration-300 pb-2">
      
      {/* Toast Notification */}
      {isSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-500 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className="text-sm font-semibold">{isSuccessToast}</span>
          <button onClick={() => setIsSuccessToast(null)} className="text-white/80 hover:text-white ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. MENTOR PORTAL HEADER STRIP WITH AMBIENT GLOW & SHEEN */}
      <div className="relative overflow-hidden kbelia-ambient-sheen rounded-2xl bg-slate-50/80 dark:bg-zinc-950/80 border border-slate-200 dark:border-zinc-700 p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Autonomous Ambient Glowing Orbs */}
        <div className="pointer-events-none absolute -top-14 -left-10 w-56 h-56 rounded-full bg-teal-500/14 dark:bg-teal-500/16 blur-3xl animate-ambient-orb-a" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-16 right-8 w-52 h-52 rounded-full bg-cyan-500/12 dark:bg-cyan-500/14 blur-3xl animate-ambient-orb-b" aria-hidden="true" />

        <div className="relative z-10 space-y-1">
          {(() => {
            const mentorDisplayName = currentMentor?.name || userProfile?.fullName || 'Mentor';
            const mentorHeaderMap: Record<MentorSubTab, { prefix: string; accent: string }> = {
              overview: {
                prefix: !isEn ? 'Ringkasan & ' : 'Mentorship ',
                accent: !isEn ? 'Prestasi Bimbingan' : 'Performance'
              },
              sessions: {
                prefix: !isEn ? 'Pengurusan ' : 'Manage ',
                accent: !isEn ? 'Sesi Bimbingan' : 'Coaching Sessions'
              },
              endorsements: {
                prefix: !isEn ? 'Pengeluaran ' : 'Issue ',
                accent: !isEn ? 'Perakuan Geran' : 'Grant Endorsements'
              },
              logbook: {
                prefix: !isEn ? 'Jurnal & ' : 'Session ',
                accent: !isEn ? 'Rekod Sesi' : 'Logbook & Notes'
              },
              profile: {
                prefix: !isEn ? 'Pengurusan ' : 'Manage ',
                accent: !isEn ? 'Profil & Jadual' : 'Profile & Schedule'
              }
            };
            const currentMentorHeader = mentorHeaderMap[currentSubTab] || mentorHeaderMap.overview;
            return (
              <>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-black dark:text-white">
                  {currentMentorHeader.prefix}
                  <span className="kbelia-title-shimmer">{currentMentorHeader.accent}</span>
                </h1>
                <p className="text-[0.9375rem] text-black/75 dark:text-white/75 max-w-2xl leading-relaxed">
                  {!isEn ? (
                    <>
                      Selamat kembali, <span className="font-semibold text-black dark:text-white">{mentorDisplayName}</span>
                    </>
                  ) : (
                    <>
                      Welcome back, <span className="font-semibold text-black dark:text-white">{mentorDisplayName}</span>
                    </>
                  )}
                </p>
              </>
            );
          })()}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB 0: RINGKASAN EKSEKUTIF (BENTO SAAS COMMAND CENTER)                */}
      {/* ===================================================================== */}
      {currentSubTab === 'overview' && (() => {
        // District breakdown for Recharts BarChart: combine real mentor data with starter Kelantan baseline
        const STARTER_MENTOR_DISTRICTS: { key: string; short: string; sesi: number; perakuan: number }[] = [
          { key: 'Kota Bharu', short: 'K. Bharu', sesi: 3, perakuan: 2 },
          { key: 'Bachok', short: 'Bachok', sesi: 2, perakuan: 1 },
          { key: 'Pasir Mas', short: 'P. Mas', sesi: 2, perakuan: 1 },
          { key: 'Tumpat', short: 'Tumpat', sesi: 1, perakuan: 1 },
          { key: 'Machang', short: 'Machang', sesi: 1, perakuan: 1 },
          { key: 'Pasir Puteh', short: 'P. Puteh', sesi: 1, perakuan: 0 },
          { key: 'Jeli', short: 'Jeli', sesi: 1, perakuan: 1 },
          { key: 'Tanah Merah', short: 'T. Merah', sesi: 1, perakuan: 0 }
        ];
        const shortDistrictLabel = (d: string) =>
          d === 'Kota Bharu' ? 'K. Bharu'
            : d === 'Tanah Merah' ? 'T. Merah'
            : d === 'Pasir Puteh' ? 'P. Puteh'
            : d === 'Pasir Mas' ? 'P. Mas'
            : d === 'Kuala Krai' ? 'K. Krai'
            : d === 'Gua Musang' ? 'G. Musang'
            : d;

        const districtMap = new Map<string, { district: string; fullName: string; sesi: number; perakuan: number }>();
        mentorRegistrations.forEach(r => {
          const key = r.district || 'Kota Bharu';
          const curr = districtMap.get(key) || { district: shortDistrictLabel(key), fullName: key, sesi: 0, perakuan: 0 };
          curr.sesi += 1;
          districtMap.set(key, curr);
        });
        mentorEndorsements.forEach(e => {
          const key = e.district || 'Kota Bharu';
          const curr = districtMap.get(key) || { district: shortDistrictLabel(key), fullName: key, sesi: 0, perakuan: 0 };
          curr.perakuan += 1;
          districtMap.set(key, curr);
        });
        // Merge starter sample baseline so mentors with sparse/zero personal records still get a rich comparative bar chart
        STARTER_MENTOR_DISTRICTS.forEach(base => {
          const existing = districtMap.get(base.key);
          if (!existing) {
            districtMap.set(base.key, {
              district: base.short,
              fullName: base.key,
              sesi: base.sesi,
              perakuan: base.perakuan
            });
          } else {
            if (existing.sesi === 0) existing.sesi = base.sesi;
            if (existing.perakuan === 0) existing.perakuan = base.perakuan;
          }
        });
        const mentorChartData = Array.from(districtMap.values()).slice(0, 8);

        // Grant endorsement tier breakdown (RM3,000 / RM5,000 / RM10,000) for RoleDonutCard
        const activeEndorsementsList = mentorEndorsements.filter((e) => e.status === 'active');
        const tier3kCount = activeEndorsementsList.filter((e) => e.recommendedAmount === 'RM3,000').length;
        const tier5kCount = activeEndorsementsList.filter((e) => e.recommendedAmount === 'RM5,000').length;
        const tier10kCount = activeEndorsementsList.filter((e) => e.recommendedAmount === 'RM10,000').length;
        const totalEndorsedRm = tier3kCount * 3000 + tier5kCount * 5000 + tier10kCount * 10000;
        const avgEndorsedRm =
          activeEndorsementsList.length > 0 ? Math.round(totalEndorsedRm / activeEndorsementsList.length) : 0;
        const centerEndorsedDisplay =
          totalEndorsedRm >= 1000
            ? `RM${(totalEndorsedRm / 1000).toFixed(totalEndorsedRm % 1000 === 0 ? 0 : 1)}K`
            : `RM${totalEndorsedRm}`;
        const endorsementTierSegments = [
          {
            name: 'Tier RM3,000',
            value: tier3kCount,
            color: '#0D9488',
            secondaryLabel: `RM ${(tier3kCount * 3000).toLocaleString('ms-MY')}`
          },
          {
            name: 'Tier RM5,000',
            value: tier5kCount,
            color: '#2563EB',
            secondaryLabel: `RM ${(tier5kCount * 5000).toLocaleString('ms-MY')}`
          },
          {
            name: 'Tier RM10,000',
            value: tier10kCount,
            color: '#F59E0B',
            secondaryLabel: `RM ${(tier10kCount * 10000).toLocaleString('ms-MY')}`
          }
        ];

        return (
        <div className="space-y-4 animate-in fade-in duration-200">

          {/* 4 Compact Summary KPI Cards inside Overview Bento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <SaaSKpiCard
              title="Jumlah Usahawan Mentee"
              value={totalMentees}
              subtitle={`${pendingCount} Menunggu Tindakan`}
              icon={Users}
              trendLabel={pendingCount > 0 ? `${pendingCount} Baharu` : 'Terkawal'}
              trendDirection={pendingCount > 0 ? 'up' : 'neutral'}
              accentColor="blue"
              isLive
              staggerIndex={0}
              onClick={() => handleSubTabChange('sessions')}
            />

            <SaaSKpiCard
              title="Sesi Bimbingan Disahkan"
              value={confirmedCount}
              subtitle="Kampus & Google Meet"
              icon={Calendar}
              trendLabel={`${completedCount} Selesai`}
              trendDirection={confirmedCount > 0 ? 'up' : 'neutral'}
              accentColor="emerald"
              isLive
              staggerIndex={1}
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
              staggerIndex={2}
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
              staggerIndex={3}
              onClick={() => handleSubTabChange('logbook')}
            />
          </div>

          {/* [2] Seksyen Analitik 2:1 — Graf Taburan Negeri (2 Bahagian) + Donat Perakuan Geran (1 Bahagian) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 items-stretch">
            <div
              style={{ '--stagger': 4 } as React.CSSProperties}
              className="animate-dashboard-card lg:col-span-2 h-full w-full bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-slate-300 dark:border-zinc-700 hover:border-slate-400/80 dark:hover:border-zinc-500 shadow-sm transition-all duration-200 min-w-0 flex flex-col justify-between"
            >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-300 dark:border-zinc-600 mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-black dark:text-white/80 shrink-0" />
                <h3 className="text-sm sm:text-base font-bold text-black dark:text-white tracking-tight">
                  Taburan Sesi &amp; Perakuan Seluruh Kelantan
                </h3>
              </div>
              <span className="text-[0.8125rem] font-mono font-bold text-black dark:text-white bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/70 px-2.5 py-1 rounded-md">
                Seluruh Kelantan
              </span>
            </div>

            <div className="h-[220px] w-full min-w-0 [&_.recharts-cartesian-axis-tick_text]:fill-slate-700 dark:[&_.recharts-cartesian-axis-tick_text]:fill-slate-200">
              <ResponsiveContainer width="100%" height={220} minWidth={0} initialDimension={{ width: 640, height: 220 }}>
                <BarChart
                  data={mentorChartData}
                  barCategoryGap="16%"
                  barGap={4}
                  margin={{ top: 24, right: 12, left: -4, bottom: 6 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.24)" />
                  <XAxis dataKey="district" tick={{ fontSize: 12.5, fontWeight: 600 }} interval={0} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, (dataMax: number) => Math.max(dataMax, 4)]} allowDecimals={false} tick={{ fontSize: 13, fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(13, 148, 136, 0.12)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload as { fullName?: string; district: string; sesi: number; perakuan: number };
                        return (
                          <div className="px-3.5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-mono shadow-xl border border-slate-700">
                            <div className="font-bold text-white mb-1">{d.fullName || d.district}</div>
                            <div className="text-white/90">Sesi Bimbingan: {d.sesi}</div>
                            <div className="text-white/90">Perakuan Geran: {d.perakuan}</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="sesi"
                    name="Sesi Bimbingan"
                    fill="#0D9488"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={38}
                    minPointSize={(val) => (Number(val) > 0 ? 4 : 0)}
                    isAnimationActive={!prefersReducedMotion}
                    animationDuration={650}
                    animationEasing="ease-out"
                    shape={(barProps: unknown) => (
                      <AnimatedShimmerBar
                        {...(barProps as AnimatedShimmerBarProps)}
                        radius={6}
                        reducedMotion={prefersReducedMotion}
                      />
                    )}
                  >
                    <LabelList
                      dataKey="sesi"
                      position="top"
                      formatter={(val: unknown) => (Number(val) > 0 ? String(val) : '')}
                      className="fill-slate-900 dark:fill-slate-100 font-mono"
                      style={{ fontSize: 12, fontWeight: 700 }}
                    />
                  </Bar>
                  <Bar
                    dataKey="perakuan"
                    name="Perakuan Geran"
                    fill="#F59E0B"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={38}
                    minPointSize={(val) => (Number(val) > 0 ? 4 : 0)}
                    isAnimationActive={!prefersReducedMotion}
                    animationDuration={650}
                    animationEasing="ease-out"
                    shape={(barProps: unknown) => (
                      <AnimatedShimmerBar
                        {...(barProps as AnimatedShimmerBarProps)}
                        radius={6}
                        reducedMotion={prefersReducedMotion}
                      />
                    )}
                  >
                    <LabelList
                      dataKey="perakuan"
                      position="top"
                      formatter={(val: unknown) => (Number(val) > 0 ? String(val) : '')}
                      className="fill-slate-900 dark:fill-slate-100 font-mono"
                      style={{ fontSize: 12, fontWeight: 700 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            </div>

            <RoleDonutCard
              className="lg:col-span-1 h-full"
              title="Agihan Nilai Perakuan"
              subtitle="Pecahan surat perakuan mengikut tier"
              icon={Award}
              accentBarClass="bg-amber-500/85 dark:bg-amber-400/85"
              segments={endorsementTierSegments}
              centerValue={centerEndorsedDisplay}
              centerLabel="Nilai Diperaku"
              valueUnit="surat"
              summaryPairs={[
                { label: 'Surat Aktif', value: `${activeEndorsementsList.length} surat`, dotColor: '#0D9488' },
                { label: 'Purata Tier', value: `RM ${avgEndorsedRm.toLocaleString('ms-MY')}`, dotColor: '#F59E0B' }
              ]}
              emptyState={{
                title: 'Tiada Perakuan Geran Aktif',
                description: 'Keluarkan perakuan geran untuk memaparkan pecahan tier RM3,000, RM5,000 dan RM10,000.',
                actionLabel: 'Buka Perakuan Geran',
                onAction: () => handleSubTabChange('endorsements')
              }}
              staggerIndex={5}
            />
          </div>

          {/* [3] Dua Lajur Ringkasan Seimbang Kiri & Kanan: Temujanji Terdekat + Status Perakuan Geran */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-start">

            {/* Lajur Kiri: Temujanji Terdekat & Tindakan Segera */}
            <div
              style={{ '--stagger': 5 } as React.CSSProperties}
              className="animate-dashboard-card min-w-0 bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-slate-300 dark:border-zinc-700 hover:border-slate-400/80 dark:hover:border-zinc-500 shadow-sm transition-all duration-200 flex flex-col justify-start"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-300 dark:border-slate-600 mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-black dark:text-white/75 shrink-0" />
                    <h3 className="text-[0.8125rem] font-bold text-black dark:text-white uppercase tracking-wider">
                      Temujanji Terdekat &amp; Tindakan
                    </h3>
                  </div>
                  <span className="text-[0.8125rem] font-mono text-black dark:text-white bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/70 px-2 py-0.5 rounded shrink-0">
                    {mentorRegistrations.slice(0, 3).length} Sesi Terkini
                  </span>
                </div>

                <div className="space-y-2.5">
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
                      className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:border-teal-400/70 dark:hover:border-teal-500/70 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
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
                            <span className="text-sm font-bold text-black dark:text-white leading-snug break-words">
                              {reg.entrepreneurName}
                            </span>
                            <span className={`text-[0.8125rem] font-semibold px-2 py-0.5 rounded-md shrink-0 ${
                              reg.status === 'confirmed'
                                ? 'bg-amber-100 text-black dark:bg-teal-600 dark:text-white'
                                : reg.status === 'completed'
                                ? 'bg-emerald-100 text-black dark:bg-emerald-950 dark:text-white'
                                : 'bg-amber-100 text-black dark:bg-amber-950 dark:text-white'
                            }`}>
                              {reg.status === 'confirmed' ? 'Disahkan' : reg.status === 'completed' ? 'Selesai' : 'Menunggu'}
                            </span>
                          </div>
                          <p className="text-[0.875rem] text-black/70 dark:text-white/75 leading-relaxed break-words">
                            {reg.businessName} &middot; <span className="font-medium text-black dark:text-white">{reg.district}</span>
                          </p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.8125rem] text-black/70 dark:text-white/75 pt-0.5">
                            <Clock className="w-3 h-3 text-black/70 dark:text-white/75 shrink-0" />
                            <span>{reg.preferredDate || 'Akan ditetapkan'} &middot; {reg.preferredTime || '10:00 AM'}</span>
                            <span>&middot;</span>
                            <span>{normalizeMentorshipMode(reg.mode) === 'Google Meet' ? 'Google Meet' : 'Bersemuka Kampus'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {reg.status === 'pending' ? (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(reg, 'confirmed')}
                            className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[0.8125rem] font-bold transition-all cursor-pointer shadow-2xs whitespace-nowrap dark:bg-teal-600"
                          >
                            Sahkan Sesi
                          </button>
                        ) : reg.meetingLink ? (
                          <a
                            href={reg.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold transition-all inline-flex items-center gap-1.5 shadow-2xs whitespace-nowrap dark:bg-teal-600"
                          >
                            <Video className="w-3 h-3" />
                            <span>Google Meet</span>
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSubTabChange('sessions')}
                            className="px-3 py-1.5 rounded-lg bg-white hover:bg-amber-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-black dark:text-white border border-slate-300 dark:border-slate-600 text-[0.8125rem] font-semibold transition-all cursor-pointer whitespace-nowrap"
                          >
                            Butiran
                          </button>
                        )}
                      </div>
                    </div>
                    );
                  })}

                  {mentorRegistrations.length === 0 && (
                    <div className="py-8 text-center text-sm text-black/70 dark:text-white/75">
                      Tiada temujanji aktif buat masa ini.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Lajur Kanan: Status Perakuan Geran & Dana Benih */}
            <div
              style={{ '--stagger': 6 } as React.CSSProperties}
              className="animate-dashboard-card min-w-0 bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-slate-300 dark:border-zinc-700 hover:border-slate-400/80 dark:hover:border-zinc-500 shadow-sm transition-all duration-200 flex flex-col justify-start"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-300 dark:border-slate-600 mb-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-black/70 dark:text-white/75 shrink-0" />
                    <h3 className="text-[0.8125rem] font-bold text-black dark:text-white uppercase tracking-wider">
                      Status Perakuan Geran Usahawan
                    </h3>
                  </div>
                  <span className="text-[0.8125rem] font-mono text-black dark:text-white bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded shrink-0">
                    {mentorEndorsements.length} Diluluskan
                  </span>
                </div>

                <div className="space-y-2.5">
                  {mentorEndorsements.slice(0, 3).map((end) => (
                    <div
                      key={end.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-amber-950/20 border border-slate-200 dark:border-amber-900/40 hover:border-amber-400/70 dark:hover:border-amber-500/60 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-black dark:text-white leading-snug break-words">
                            {end.menteeName}
                          </span>
                          <span className="text-[0.8125rem] font-mono font-bold text-black dark:text-white bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded shrink-0">
                            {end.recommendedAmount}
                          </span>
                        </div>
                        <p className="text-[0.875rem] text-black dark:text-white leading-relaxed break-words">
                          {end.businessName} &middot; <span className="text-black/70 dark:text-white/75">{end.district}</span>
                        </p>
                        <p className="text-[0.875rem] font-mono text-black/70 dark:text-white/75 pt-0.5 break-words">
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
                          className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[0.8125rem] font-bold transition-all cursor-pointer shadow-2xs whitespace-nowrap dark:bg-teal-600"
                        >
                          Lihat Surat
                        </button>
                      </div>
                    </div>
                  ))}

                  {mentorEndorsements.length === 0 && (
                    <div className="py-8 text-center text-sm text-black/70 dark:text-white/75">
                      Belum ada surat perakuan geran dikeluarkan.
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

            {/* Direktori Ringkas Usahawan Mentee (Reference Table) */}
            <div className="space-y-3">
              <div>
                <h3 className="text-[0.8125rem] font-bold text-black dark:text-white uppercase tracking-wider">
                  Direktori Ringkas Usahawan Mentee
                </h3>
                <p className="text-[0.875rem] text-black/70 dark:text-white/75">
                  Senarai usahawan belia di bawah pemantauan {currentMentor.name}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xs overflow-visible">
                <ReferenceTableToolbar
                  accent="teal"
                  searchValue={overviewSearch}
                  onSearchChange={setOverviewSearch}
                  searchPlaceholder="Cari usahawan, perniagaan, topik atau daerah..."
                  filterCount={
                    (overviewStatusFilter !== 'all' ? 1 : 0) +
                    (overviewDistrictFilter !== 'all' ? 1 : 0) +
                    (overviewSortPreset !== DEFAULT_SORT_VALUE ? 1 : 0)
                  }
                  onResetFilters={() => {
                    setOverviewStatusFilter('all');
                    setOverviewDistrictFilter('all');
                    setOverviewSortPreset(DEFAULT_SORT_VALUE);
                  }}
                  sortOptions={
                    overviewSortPreset === 'table_column'
                      ? [{ value: '', label: 'Ikut Lajur Jadual' }, ...overviewSortOptions]
                      : overviewSortOptions
                  }
                  sortValue={overviewSortPreset === 'table_column' ? '' : overviewSortPreset}
                  onSortChange={(val) => {
                    if (val) setOverviewSortPreset(val);
                  }}
                  filterContent={
                    <>
                      <div>
                        <label className="block text-xs font-bold text-black/70 dark:text-white/75 mb-1.5">
                          Status Bimbingan
                        </label>
                        <select
                          value={overviewStatusFilter}
                          onChange={(e) => setOverviewStatusFilter(e.target.value as 'all' | 'pending' | 'confirmed' | 'completed')}
                          className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white cursor-pointer"
                        >
                          <option value="all">Semua Status</option>
                          <option value="pending">Menunggu Pengesahan</option>
                          <option value="confirmed">Disahkan</option>
                          <option value="completed">Selesai</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-black/70 dark:text-white/75 mb-1.5">
                          Daerah
                        </label>
                        <select
                          value={overviewDistrictFilter}
                          onChange={(e) => setOverviewDistrictFilter(e.target.value as 'all' | KelantanDistrict)}
                          className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white cursor-pointer"
                        >
                          <option value="all">Semua Daerah</option>
                          {uniqueMentorDistricts.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  }
                />

                {overviewRegistrations.length === 0 ? (
                  <div className="py-10 text-center text-[0.9375rem] text-black/70 dark:text-white/75">
                    Tiada rekod usahawan mentee dijumpai.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/70 dark:bg-zinc-950/60 border-b border-slate-200 dark:border-zinc-700">
                          <th className="py-3 px-4 text-xs font-semibold text-black/60 dark:text-white/65">
                            <button
                              type="button"
                              onClick={() => {
                                setOverviewSortPreset('table_column');
                                if (overviewSortBy === 'name') setOverviewSortDir(p => p === 'asc' ? 'desc' : 'asc');
                                else { setOverviewSortBy('name'); setOverviewSortDir('asc'); }
                              }}
                              className="inline-flex items-center gap-1 hover:text-black dark:hover:text-white cursor-pointer"
                            >
                              <span>Usahawan &amp; Perniagaan</span>
                              <ArrowUpDown className="w-3 h-3" />
                            </button>
                          </th>
                          <th className="py-3 px-4 text-xs font-semibold text-black/60 dark:text-white/65">
                            <button
                              type="button"
                              onClick={() => {
                                setOverviewSortPreset('table_column');
                                if (overviewSortBy === 'district') setOverviewSortDir(p => p === 'asc' ? 'desc' : 'asc');
                                else { setOverviewSortBy('district'); setOverviewSortDir('asc'); }
                              }}
                              className="inline-flex items-center gap-1 hover:text-black dark:hover:text-white cursor-pointer"
                            >
                              <span>Daerah &amp; Topik</span>
                              <ArrowUpDown className="w-3 h-3" />
                            </button>
                          </th>
                          <th className="py-3 px-4 text-xs font-semibold text-black/60 dark:text-white/65">
                            Perakuan Geran
                          </th>
                          <th className="py-3 px-4 text-xs font-semibold text-black/60 dark:text-white/65">
                            <button
                              type="button"
                              onClick={() => {
                                setOverviewSortPreset('table_column');
                                if (overviewSortBy === 'status') setOverviewSortDir(p => p === 'asc' ? 'desc' : 'asc');
                                else { setOverviewSortBy('status'); setOverviewSortDir('asc'); }
                              }}
                              className="inline-flex items-center gap-1 hover:text-black dark:hover:text-white cursor-pointer"
                            >
                              <span>Status</span>
                              <ArrowUpDown className="w-3 h-3" />
                            </button>
                          </th>
                          <th className="py-3 px-4 w-14 text-right text-xs font-semibold text-black/60 dark:text-white/65">
                            <span className="sr-only">Tindakan</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-zinc-700 text-sm">
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
                            <tr key={mentee.id} className="kbelia-table-row">
                              <td className="py-3.5 px-4 max-w-xs">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 shrink-0">
                                    <PortalImage
                                      src={visuals.businessUrl}
                                      alt={mentee.businessName}
                                      fallbackType="business"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-bold text-black dark:text-white truncate">{mentee.entrepreneurName}</div>
                                    <div className="text-xs text-black/65 dark:text-white/65 truncate">{mentee.businessName}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 max-w-xs">
                                <div className="text-black/85 dark:text-white/85 font-medium truncate">{mentee.district}</div>
                                <div className="text-xs text-black/60 dark:text-white/60 truncate">{mentee.topic}</div>
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                  hasEndorsement
                                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                                    : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-black/70 dark:text-white/75'
                                }`}>
                                  {hasEndorsement ? 'Geran Diperaku' : 'Belum Diperaku'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                  mentee.status === 'confirmed'
                                    ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200'
                                    : mentee.status === 'completed'
                                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                                    : 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                                }`}>
                                  {mentee.status === 'confirmed' ? 'Disahkan' : mentee.status === 'completed' ? 'Selesai' : 'Menunggu'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                <RowActionMenu
                                  ariaLabel={`Tindakan untuk ${mentee.entrepreneurName}`}
                                  items={[
                                    {
                                      label: 'Buka Sesi Bimbingan',
                                      onClick: () => handleSubTabChange('sessions'),
                                      tone: 'accent'
                                    },
                                    {
                                      label: mentee.mentorActionPlan ? 'Kemaskini Nota Bimbingan' : 'Tambah Nota Bimbingan',
                                      onClick: () => handleOpenNotesModal(mentee)
                                    },
                                    {
                                      label: 'Perakuan Geran',
                                      onClick: () => {
                                        setNewEndorsementMenteeName(mentee.entrepreneurName);
                                        setNewEndorsementBusinessName(mentee.businessName);
                                        setNewEndorsementDistrict(mentee.district);
                                        setIsNewEndorsementModalOpen(true);
                                      }
                                    }
                                  ]}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {overviewRegistrations.length > 0 && (
                  <PaginationBar
                    currentPage={overviewPagination.currentPage}
                    totalItems={overviewPagination.totalItems}
                    itemsPerPage={7}
                    onPageChange={overviewPagination.setCurrentPage}
                    itemLabel="usahawan"
                    accent="teal"
                  />
                )}
              </div>
            </div>

        </div>
        );
      })()}

      {/* ===================================================================== */}
      {/* TAB 1: SESI BIMBINGAN (LAYOUT KEBAWAH PENUH & MESRA BACAAN MESEJ)     */}
      {/* ===================================================================== */}
      {currentSubTab === 'sessions' && (
        <div key="sessions" className="flex flex-col space-y-5 animate-dashboard-tab">
          
          {/* =================================================================== */}
          {/* SEKSYEN 1: PERMOHONAN BIMBINGAN (REFERENCE TABLE + DRAWER)           */}
          {/* =================================================================== */}
          <section id="mentor-applications-section" className="space-y-3.5 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800/70 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-black dark:text-white tracking-tight">
                    Permohonan Bimbingan
                  </h3>
                </div>
                <p className="text-[0.9375rem] text-black/75 dark:text-white/75 mt-1">
                  Senarai permohonan aktif (rekod selesai boleh ditapis melalui Penapis). Klik baris atau menu tiga titik untuk butiran &amp; tindakan.
                </p>
              </div>

              <span className="text-[0.8125rem] font-mono font-bold tabular-nums px-3 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-black dark:text-white border border-teal-200 dark:border-teal-800/70 self-start sm:self-auto">
                {filteredRegistrations.length} {statusFilter === 'completed' ? 'Selesai' : 'Rekod'}
              </span>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 overflow-visible shadow-2xs">
              <ReferenceTableToolbar
                accent="teal"
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Cari usahawan, perniagaan, topik atau daerah..."
                filterCount={
                  (statusFilter !== 'all' ? 1 : 0) +
                  (modeFilter !== 'all' ? 1 : 0) +
                  (applicationsSortPreset !== DEFAULT_SORT_VALUE ? 1 : 0)
                }
                onResetFilters={() => {
                  setStatusFilter('all');
                  setModeFilter('all');
                  setApplicationsSortPreset(DEFAULT_SORT_VALUE);
                }}
                sortOptions={
                  applicationsSortPreset === 'table_column'
                    ? [{ value: '', label: 'Ikut Lajur Jadual' }, ...applicationsSortOptions]
                    : applicationsSortOptions
                }
                sortValue={applicationsSortPreset === 'table_column' ? '' : applicationsSortPreset}
                onSortChange={(val) => {
                  if (val) setApplicationsSortPreset(val);
                }}
                filterContent={
                  <>
                    <div>
                      <label className="block text-xs font-bold text-black/70 dark:text-white/75 mb-1.5">
                        Status Permohonan
                      </label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled')}
                        className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white cursor-pointer"
                      >
                        <option value="all">Aktif ({activeCount})</option>
                        <option value="pending">Menunggu ({pendingCount})</option>
                        <option value="confirmed">Disahkan ({confirmedCount})</option>
                        <option value="completed">Selesai ({completedCount})</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-black/70 dark:text-white/75 mb-1.5">
                        Mod Sesi
                      </label>
                      <select
                        value={modeFilter}
                        onChange={(e) => setModeFilter(e.target.value as 'all' | 'Bersemuka di Kampus' | 'Google Meet')}
                        className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white cursor-pointer"
                      >
                        <option value="all">Semua Mod</option>
                        <option value="Bersemuka di Kampus">Bersemuka di Kampus</option>
                        <option value="Google Meet">Google Meet</option>
                      </select>
                    </div>
                  </>
                }
              />

              {filteredRegistrations.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <GraduationCap className="w-10 h-10 text-black/40 dark:text-white/40 mx-auto mb-2" />
                  <p className="text-sm font-bold text-black dark:text-white">
                    {statusFilter === 'completed'
                      ? 'Tiada rekod bimbingan yang telah selesai buat masa ini.'
                      : 'Tiada permohonan bimbingan ditemui.'}
                  </p>
                  <p className="text-[0.9375rem] text-black/70 dark:text-white/75 mt-1">
                    {statusFilter !== 'completed' && completedCount > 0
                      ? 'Permohonan yang telah selesai dibimbing boleh dilihat dengan menukar Status di Penapis.'
                      : 'Cuba tukar kata kunci carian atau tetapkan semula penapis.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 dark:bg-zinc-950/60 border-b border-slate-200 dark:border-zinc-700">
                        <th className="py-3 px-4 text-xs font-semibold text-black/60 dark:text-white/65">
                          <button
                            type="button"
                            onClick={() => {
                              setApplicationsSortPreset('table_column');
                              if (applicationsSortBy === 'name') setApplicationsSortDir(p => p === 'asc' ? 'desc' : 'asc');
                              else { setApplicationsSortBy('name'); setApplicationsSortDir('asc'); }
                            }}
                            className="inline-flex items-center gap-1 hover:text-black dark:hover:text-white cursor-pointer"
                          >
                            <span>Usahawan &amp; Perniagaan</span>
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="py-3 px-4 text-xs font-semibold text-black/60 dark:text-white/65">
                          <button
                            type="button"
                            onClick={() => {
                              setApplicationsSortPreset('table_column');
                              if (applicationsSortBy === 'date') setApplicationsSortDir(p => p === 'asc' ? 'desc' : 'asc');
                              else { setApplicationsSortBy('date'); setApplicationsSortDir('asc'); }
                            }}
                            className="inline-flex items-center gap-1 hover:text-black dark:hover:text-white cursor-pointer"
                          >
                            <span>Topik &amp; Tarikh</span>
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="py-3 px-4 text-xs font-semibold text-black/60 dark:text-white/65">
                          Daerah
                        </th>
                        <th className="py-3 px-4 text-xs font-semibold text-black/60 dark:text-white/65">
                          <button
                            type="button"
                            onClick={() => {
                              setApplicationsSortPreset('table_column');
                              if (applicationsSortBy === 'status') setApplicationsSortDir(p => p === 'asc' ? 'desc' : 'asc');
                              else { setApplicationsSortBy('status'); setApplicationsSortDir('asc'); }
                            }}
                            className="inline-flex items-center gap-1 hover:text-black dark:hover:text-white cursor-pointer"
                          >
                            <span>Status</span>
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="py-3 px-4 w-14 text-right text-xs font-semibold text-black/60 dark:text-white/65">
                          <span className="sr-only">Tindakan</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-zinc-700 text-sm">
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
                          <React.Fragment key={mentee.id}>
                            <tr
                              onClick={() =>
                                setExpandedApplicationIds(prev => ({ ...prev, [mentee.id]: !prev[mentee.id] }))
                              }
                              className="kbelia-table-row cursor-pointer"
                            >
                              <td className="py-3.5 px-4 max-w-xs">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 shrink-0">
                                    <PortalImage
                                      src={visuals.businessUrl}
                                      alt={mentee.businessName}
                                      fallbackType="business"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-bold text-black dark:text-white truncate">{mentee.entrepreneurName}</div>
                                    <div className="text-xs text-black/65 dark:text-white/65 truncate">{mentee.businessName}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 max-w-xs">
                                <div className="font-medium text-black dark:text-white truncate">{mentee.topic}</div>
                                <div className="text-xs text-black/60 dark:text-white/60 tabular-nums truncate">
                                  {mentee.preferredDate ? `${mentee.preferredDate} · ${mentee.preferredTime || '10:00 AM'}` : mentee.businessCategory || 'Perniagaan Belia'}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-black/80 dark:text-white/80 whitespace-nowrap">
                                {mentee.district || 'Kelantan'}
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
                                    isCompleted
                                      ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                                      : isConfirmed
                                      ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 border-teal-200 dark:border-teal-800'
                                      : isPending
                                      ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800'
                                      : 'bg-rose-50 dark:bg-rose-950/70 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
                                  }`}
                                >
                                  {isCompleted ? 'Selesai' : isConfirmed ? 'Disahkan' : isPending ? 'Menunggu' : 'Dibatalkan'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                <RowActionMenu
                                  ariaLabel={`Tindakan untuk permohonan ${mentee.entrepreneurName}`}
                                  items={[
                                    {
                                      label: isExpanded ? 'Tutup Butiran' : 'Lihat Butiran & Mesej',
                                      onClick: () =>
                                        setExpandedApplicationIds(prev => ({ ...prev, [mentee.id]: !prev[mentee.id] }))
                                    },
                                    ...(isPending
                                      ? [{
                                          label: 'Sahkan Sesi Bimbingan',
                                          onClick: () => handleStatusChange(mentee, 'confirmed'),
                                          tone: 'accent' as const
                                        }]
                                      : []),
                                    ...(isConfirmed
                                      ? [{
                                          label: 'Tandakan Selesai Sesi',
                                          onClick: () => handleStatusChange(mentee, 'completed'),
                                          tone: 'accent' as const
                                        }]
                                      : []),
                                    {
                                      label: mentee.mentorActionPlan ? 'Kemaskini Nota Bimbingan' : 'Tambah Nota Bimbingan',
                                      onClick: () => handleOpenNotesModal(mentee)
                                    },
                                    {
                                      label: 'Perakuan Geran',
                                      onClick: () => {
                                        setNewEndorsementMenteeName(mentee.entrepreneurName);
                                        setNewEndorsementBusinessName(mentee.businessName);
                                        setNewEndorsementDistrict(mentee.district);
                                        setIsNewEndorsementModalOpen(true);
                                      }
                                    }
                                  ]}
                                />
                              </td>
                            </tr>

                            {isExpanded && (
                              <tr className="bg-slate-50/80 dark:bg-zinc-950/40">
                                <td colSpan={5} className="px-4 sm:px-5 py-4 space-y-3">
                                  <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 space-y-1.5">
                                    <div className="flex items-center gap-2 text-sm font-bold text-black dark:text-white">
                                      <MessageSquare className="w-3.5 h-3.5 text-black/70 dark:text-white/75" />
                                      <span>Mesej Permohonan &amp; Cabaran Usahawan:</span>
                                    </div>
                                    <p className="text-[0.9375rem] leading-relaxed text-black dark:text-white whitespace-pre-line">
                                      {mentee.challenges ? (
                                        `"${mentee.challenges}"`
                                      ) : (
                                          <span className="italic text-black/70 dark:text-white/75">
                                            "Usahawan memohon sesi bimbingan khusus bagi strategi pemasaran, pengurusan kos operasi, dan persediaan dokumentasi permohonan geran belia."
                                          </span>
                                        )}
                                      </p>
                                    </div>

                                    {mentee.mentorActionPlan && (
                                      <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800/70 space-y-1">
                                        <div className="flex items-center justify-between text-sm font-bold text-black dark:text-white">
                                          <span className="flex items-center gap-1.5">
                                            <FileText className="w-3.5 h-3.5" />
                                            <span>Nota Bimbingan Mentor Tersimpan:</span>
                                          </span>
                                          <span className="text-[0.8125rem] font-normal opacity-75">Telah dihantar</span>
                                        </div>
                                        <p className="text-[0.9375rem] text-black dark:text-white whitespace-pre-line leading-relaxed">
                                          {mentee.mentorActionPlan}
                                        </p>
                                      </div>
                                    )}

                                    <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                                      <a
                                        href={cleanPhone ? `https://wa.me/${cleanPhone}?text=Salam%20${encodeURIComponent(mentee.entrepreneurName)}%2C%20saya%20mentor%20anda%20dari%20Hab%20Usahawan%20KBelia.` : '#'}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-3 py-1.5 rounded-xl text-sm font-bold text-black dark:text-white bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors flex items-center gap-1.5 cursor-pointer"
                                    >
                                      <Phone className="w-3.5 h-3.5" />
                                      <span>WhatsApp Usahawan</span>
                                    </a>

                                    <div className="flex flex-wrap items-center gap-2">
                                      {isPending && (
                                        <button
                                          type="button"
                                          onClick={() => handleStatusChange(mentee, 'confirmed')}
                                          className="px-3.5 py-1.5 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs dark:bg-teal-600"
                                        >
                                          <Calendar className="w-3.5 h-3.5" />
                                          <span>Sahkan Sesi Bimbingan</span>
                                        </button>
                                      )}

                                      {isConfirmed && (
                                        <button
                                          type="button"
                                          onClick={() => handleStatusChange(mentee, 'completed')}
                                          className="px-3.5 py-1.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                                        >
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                          <span>Tandakan Selesai Sesi</span>
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => handleOpenNotesModal(mentee)}
                                        className="px-3 py-1.5 rounded-xl text-sm font-bold text-black dark:text-white bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 hover:bg-amber-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer"
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
                                        className="px-3 py-1.5 rounded-xl text-sm font-bold text-black dark:text-white bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors flex items-center gap-1.5 cursor-pointer"
                                      >
                                        <Award className="w-3.5 h-3.5" />
                                        <span>Perakuan Geran</span>
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {filteredRegistrations.length > 0 && (
                <PaginationBar
                  currentPage={applicationsPagination.currentPage}
                  totalItems={applicationsPagination.totalItems}
                  itemsPerPage={7}
                  onPageChange={applicationsPagination.setCurrentPage}
                  itemLabel="permohonan"
                  accent="teal"
                />
              )}
            </div>
          </section>

          {/* =================================================================== */}
          {/* SEKSYEN 2: JADUAL (REFERENCE TABLE + EXPANDABLE DRAWER)             */}
          {/* =================================================================== */}
          <section id="mentor-schedule-section" className="space-y-4 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/70 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-black dark:text-white tracking-tight">
                    Jadual
                  </h3>
                </div>
                <p className="text-[0.9375rem] text-black/75 dark:text-white/75 mt-1">
                  Takwim sesi temujanji aktif bersemuka di bilik bimbingan Hab Usahawan serta sesi Google Meet.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsNewSlotModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer self-start sm:self-auto dark:bg-blue-600"
              >
                <Plus className="w-4 h-4" />
                <span>+ Slot Baharu</span>
              </button>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 overflow-visible shadow-2xs">
              <ReferenceTableToolbar
                accent="teal"
                searchValue={scheduleSearch}
                onSearchChange={setScheduleSearch}
                searchPlaceholder="Cari usahawan, topik atau tarikh sesi..."
                filterCount={(scheduleModeFilter !== 'all' ? 1 : 0) + (scheduleSortPreset !== DEFAULT_SORT_VALUE ? 1 : 0)}
                onResetFilters={() => {
                  setScheduleModeFilter('all');
                  setScheduleSortPreset(DEFAULT_SORT_VALUE);
                }}
                sortOptions={
                  scheduleSortPreset === 'table_column'
                    ? [{ value: '', label: 'Ikut Lajur Jadual' }, ...scheduleSortOptions]
                    : scheduleSortOptions
                }
                sortValue={scheduleSortPreset === 'table_column' ? '' : scheduleSortPreset}
                onSortChange={(val) => {
                  if (val) setScheduleSortPreset(val);
                }}
                filterContent={
                  <div>
                    <label className="block text-xs font-bold text-black/70 dark:text-white/75 mb-1.5">
                      Mod Temujanji
                    </label>
                    <select
                      value={scheduleModeFilter}
                      onChange={(e) => setScheduleModeFilter(e.target.value as 'all' | 'Bersemuka di Kampus' | 'Google Meet')}
                      className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white cursor-pointer"
                    >
                      <option value="all">Semua Mod</option>
                      <option value="Google Meet">Google Meet</option>
                      <option value="Bersemuka di Kampus">Bersemuka di Hab Usahawan</option>
                    </select>
                  </div>
                }
              />

              {filteredScheduleSessions.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <Clock className="w-10 h-10 text-black/40 dark:text-white/40 mx-auto mb-2" />
                  <p className="text-sm font-bold text-black dark:text-white">Tiada sesi bimbingan aktif ditetapkan dalam jadual.</p>
                  <p className="text-[0.9375rem] text-black/70 dark:text-white/75 mt-1">Sahkan permohonan bimbingan di bahagian atas untuk menjadualkan tarikh dan slot.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 dark:bg-zinc-950/60 border-b border-slate-200 dark:border-zinc-700">
                        <th className="py-3 px-4 text-xs font-semibold text-black/60 dark:text-white/65">
                          <button
                            type="button"
                            onClick={() => {
                              setScheduleSortPreset('table_column');
                              if (scheduleSortBy === 'name') setScheduleSortDir(p => p === 'asc' ? 'desc' : 'asc');
                              else { setScheduleSortBy('name'); setScheduleSortDir('asc'); }
                            }}
                            className="inline-flex items-center gap-1 hover:text-black dark:hover:text-white cursor-pointer"
                          >
                            <span>Usahawan &amp; Perniagaan</span>
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="py-3 px-4 text-xs font-semibold text-black/60 dark:text-white/65">
                          <button
                            type="button"
                            onClick={() => {
                              setScheduleSortPreset('table_column');
                              if (scheduleSortBy === 'date') setScheduleSortDir(p => p === 'asc' ? 'desc' : 'asc');
                              else { setScheduleSortBy('date'); setScheduleSortDir('asc'); }
                            }}
                            className="inline-flex items-center gap-1 hover:text-black dark:hover:text-white cursor-pointer"
                          >
                            <span>Tarikh &amp; Masa</span>
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="py-3 px-4 text-xs font-semibold text-black/60 dark:text-white/65">
                          Mod &amp; Lokasi
                        </th>
                        <th className="py-3 px-4 text-xs font-semibold text-black/60 dark:text-white/65">
                          Daerah
                        </th>
                        <th className="py-3 px-4 w-14 text-right text-xs font-semibold text-black/60 dark:text-white/65">
                          <span className="sr-only">Tindakan</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-zinc-700 text-sm">
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
                          <React.Fragment key={mentee.id}>
                            <tr
                              onClick={() =>
                                setExpandedScheduleIds(prev => ({ ...prev, [mentee.id]: !prev[mentee.id] }))
                              }
                              className="kbelia-table-row cursor-pointer"
                            >
                              <td className="py-3.5 px-4 max-w-xs">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 shrink-0">
                                    <PortalImage
                                      src={visuals.businessUrl}
                                      alt={mentee.businessName}
                                      fallbackType="business"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-bold text-black dark:text-white truncate">{mentee.entrepreneurName}</div>
                                    <div className="text-xs text-black/65 dark:text-white/65 truncate">{mentee.businessName}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap tabular-nums">
                                <div className="font-semibold text-black dark:text-white">{mentee.preferredDate || 'Akan Ditetapkan'}</div>
                                <div className="text-xs text-black/60 dark:text-white/60">{mentee.preferredTime || '10:00 AM'}</div>
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800">
                                  {mentee.meetingLink || normalizeMentorshipMode(mentee.mode) === 'Google Meet'
                                    ? 'Google Meet'
                                    : 'Bilik Bimbingan Hab Usahawan'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-black/80 dark:text-white/80 whitespace-nowrap">
                                {mentee.district || 'Kelantan'}
                              </td>
                              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                <RowActionMenu
                                  ariaLabel={`Tindakan jadual untuk ${mentee.entrepreneurName}`}
                                  items={[
                                    {
                                      label: isExpanded ? 'Tutup Butiran' : 'Lihat Butiran Sesi',
                                      onClick: () =>
                                        setExpandedScheduleIds(prev => ({ ...prev, [mentee.id]: !prev[mentee.id] }))
                                    },
                                    ...(mentee.meetingLink
                                      ? [{
                                          label: 'Salin Pautan Google Meet',
                                          onClick: () => {
                                            navigator.clipboard?.writeText(mentee.meetingLink || '');
                                            showToast('Pautan Google Meet disalin.');
                                          }
                                        }]
                                      : []),
                                    {
                                      label: 'Nota Bimbingan',
                                      onClick: () => handleOpenNotesModal(mentee)
                                    },
                                    {
                                      label: 'Tandakan Selesai Sesi',
                                      onClick: () => handleStatusChange(mentee, 'completed'),
                                      tone: 'accent'
                                    }
                                  ]}
                                />
                              </td>
                            </tr>

                            {isExpanded && (
                              <tr className="bg-teal-50/35 dark:bg-teal-950/20">
                                <td colSpan={5} className="px-4 sm:px-5 py-4 space-y-3">
                                  <div className="text-sm text-black dark:text-white space-y-1">
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
                                    <div className="flex flex-wrap items-center gap-3">
                                      {mentee.meetingLink && (
                                        <a
                                          href={mentee.meetingLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors"
                                        >
                                          <Video className="w-3.5 h-3.5" />
                                          <span>Buka Google Meet</span>
                                        </a>
                                      )}
                                      {cleanPhone && (
                                        <a
                                          href={`https://wa.me/${cleanPhone}?text=Salam%20${encodeURIComponent(mentee.entrepreneurName)}%2C%20peringatan%20sesi%20bimbingan%20kita%20pada%20${encodeURIComponent(mentee.preferredDate || 'tarikh dijadualkan')}.`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-sm text-black dark:text-white/85 font-bold hover:underline flex items-center gap-1"
                                        >
                                          <Phone className="w-3.5 h-3.5" />
                                          <span>Hantar Peringatan WhatsApp</span>
                                        </a>
                                      )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenNotesModal(mentee)}
                                        className="px-3 py-1.5 rounded-lg text-sm font-semibold text-black dark:text-white bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 hover:bg-amber-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                      >
                                        Nota Bimbingan
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleStatusChange(mentee, 'completed')}
                                        className="px-3.5 py-1.5 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Selesai Sesi</span>
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {filteredScheduleSessions.length > 0 && (
                <PaginationBar
                  currentPage={schedulePagination.currentPage}
                  totalItems={schedulePagination.totalItems}
                  itemsPerPage={7}
                  onPageChange={schedulePagination.setCurrentPage}
                  itemLabel="sesi disahkan"
                  accent="teal"
                />
              )}
            </div>
          </section>

          {/* =================================================================== */}
          {/* SEKSYEN 3: NOTA BIMBINGAN USAHAWAN (REFERENCE TABLE + DRAWER)       */}
          {/* =================================================================== */}
          <section id="mentor-action-plans-section" className="space-y-4 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/70 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-black dark:text-white tracking-tight">
                    Nota Bimbingan Usahawan
                  </h3>
                </div>
                <p className="text-[0.9375rem] text-black/75 dark:text-white/75 mt-1">
                  Panduan bimbingan, sasaran jualan, dan pelan susulan usahawan.
                </p>
              </div>

              <span className="text-[0.8125rem] font-mono font-bold tabular-nums px-3 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-black dark:text-white border border-teal-200 dark:border-teal-800/70 self-start sm:self-auto">
                {filteredActionPlanMentees.length} Nota Disediakan
              </span>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 overflow-visible shadow-2xs">
              <ReferenceTableToolbar
                accent="teal"
                searchValue={actionPlansSearch}
                onSearchChange={setActionPlansSearch}
                searchPlaceholder="Cari usahawan, topik atau kandungan nota..."
                filterCount={
                  (actionPlansDistrictFilter !== 'all' ? 1 : 0) +
                  (actionPlansSortPreset !== DEFAULT_SORT_VALUE ? 1 : 0)
                }
                onResetFilters={() => {
                  setActionPlansDistrictFilter('all');
                  setActionPlansSortPreset(DEFAULT_SORT_VALUE);
                }}
                sortOptions={
                  actionPlansSortPreset === 'table_column'
                    ? [{ value: '', label: 'Ikut Lajur Jadual' }, ...actionPlansSortOptions]
                    : actionPlansSortOptions
                }
                sortValue={actionPlansSortPreset === 'table_column' ? '' : actionPlansSortPreset}
                onSortChange={(val) => {
                  if (val) setActionPlansSortPreset(val);
                }}
                filterContent={
                  <div>
                    <label className="block text-xs font-bold text-black/70 dark:text-white/75 mb-1.5">
                      Daerah
                    </label>
                    <select
                      value={actionPlansDistrictFilter}
                      onChange={(e) => setActionPlansDistrictFilter(e.target.value as 'all' | KelantanDistrict)}
                      className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white cursor-pointer"
                    >
                      <option value="all">Semua Daerah</option>
                      {uniqueMentorDistricts.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                }
              />

              {filteredActionPlanMentees.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-2">
                  <MessageSquare className="w-10 h-10 text-black/40 dark:text-white/40 mx-auto" />
                  <p className="text-sm font-bold text-black dark:text-white">Belum ada nota bimbingan ditemui.</p>
                  <p className="text-[0.9375rem] text-black/70 dark:text-white/75">Gunakan menu tindakan pada senarai permohonan untuk merekodkan panduan bisnes usahawan.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 dark:bg-zinc-950/60 border-b border-slate-200 dark:border-zinc-700">
                        <th className="py-3 px-4 text-xs font-semibold text-black/60 dark:text-white/65">
                          <button
                            type="button"
                            onClick={() => {
                              setActionPlansSortPreset('table_column');
                              if (actionPlansSortBy === 'name') setActionPlansSortDir(p => p === 'asc' ? 'desc' : 'asc');
                              else { setActionPlansSortBy('name'); setActionPlansSortDir('asc'); }
                            }}
                            className="inline-flex items-center gap-1 hover:text-black dark:hover:text-white cursor-pointer"
                          >
                            <span>Usahawan &amp; Perniagaan</span>
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="py-3 px-4 text-xs font-semibold text-black/60 dark:text-white/65">
                          <button
                            type="button"
                            onClick={() => {
                              setActionPlansSortPreset('table_column');
                              if (actionPlansSortBy === 'topic') setActionPlansSortDir(p => p === 'asc' ? 'desc' : 'asc');
                              else { setActionPlansSortBy('topic'); setActionPlansSortDir('asc'); }
                            }}
                            className="inline-flex items-center gap-1 hover:text-black dark:hover:text-white cursor-pointer"
                          >
                            <span>Topik Bimbingan</span>
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="py-3 px-4 text-xs font-semibold text-black/60 dark:text-white/65">
                          Daerah
                        </th>
                        <th className="py-3 px-4 text-xs font-semibold text-black/60 dark:text-white/65">
                          Status
                        </th>
                        <th className="py-3 px-4 w-14 text-right text-xs font-semibold text-black/60 dark:text-white/65">
                          <span className="sr-only">Tindakan</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-zinc-700 text-sm">
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
                          <React.Fragment key={mentee.id}>
                            <tr
                              onClick={() =>
                                setExpandedActionPlanIds(prev => ({ ...prev, [mentee.id]: !prev[mentee.id] }))
                              }
                              className="kbelia-table-row cursor-pointer"
                            >
                              <td className="py-3.5 px-4 max-w-xs">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 shrink-0">
                                    <PortalImage
                                      src={visuals.businessUrl}
                                      alt={mentee.businessName}
                                      fallbackType="business"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-bold text-black dark:text-white truncate">{mentee.entrepreneurName}</div>
                                    <div className="text-xs text-black/65 dark:text-white/65 truncate">{mentee.businessName}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-black/85 dark:text-white/85 max-w-xs truncate">
                                {mentee.topic}
                              </td>
                              <td className="py-3.5 px-4 text-black/80 dark:text-white/80 whitespace-nowrap">
                                {mentee.district || 'Kelantan'}
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
                                  Tersimpan
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                <RowActionMenu
                                  ariaLabel={`Tindakan nota untuk ${mentee.entrepreneurName}`}
                                  items={[
                                    {
                                      label: isExpanded ? 'Tutup Nota' : 'Lihat Nota Penuh',
                                      onClick: () =>
                                        setExpandedActionPlanIds(prev => ({ ...prev, [mentee.id]: !prev[mentee.id] }))
                                    },
                                    {
                                      label: 'Kemaskini Nota Bimbingan',
                                      onClick: () => handleOpenNotesModal(mentee),
                                      tone: 'accent'
                                    }
                                  ]}
                                />
                              </td>
                            </tr>

                            {isExpanded && (
                              <tr className="bg-teal-50/35 dark:bg-teal-950/20">
                                <td colSpan={5} className="px-4 sm:px-5 py-4 space-y-3">
                                  <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-teal-200 dark:border-teal-800/70 space-y-1.5">
                                    <span className="text-sm font-bold text-black dark:text-white block">
                                      Garis Panduan &amp; Sasaran Tindakan Mentor:
                                    </span>
                                    <p className="text-[0.9375rem] text-black dark:text-white whitespace-pre-line leading-relaxed font-sans">
                                      {mentee.mentorActionPlan}
                                    </p>
                                  </div>

                                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-black/70 dark:text-white/75">
                                    <span>Penyeliaan berterusan di bawah inisiatif Hab Usahawan KBelia</span>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenNotesModal(mentee)}
                                      className="px-3 py-1.5 rounded-lg text-sm font-bold text-black dark:text-white bg-amber-100 dark:bg-teal-600 hover:bg-amber-200 transition-colors cursor-pointer"
                                    >
                                      Kemaskini Nota Bimbingan
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {filteredActionPlanMentees.length > 0 && (
                <PaginationBar
                  currentPage={actionPlansPagination.currentPage}
                  totalItems={actionPlansPagination.totalItems}
                  itemsPerPage={7}
                  onPageChange={actionPlansPagination.setCurrentPage}
                  itemLabel="nota bimbingan"
                  accent="teal"
                />
              )}
            </div>
          </section>

        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: PERAKUAN RASMI GERAN BELIA (OFFICIAL GRANT ENDORSEMENT)       */}
      {/* ===================================================================== */}
      {currentSubTab === 'endorsements' && (
        <div key="endorsements" className="space-y-4 animate-dashboard-tab">
          
          {/* Header Action Banner */}
          <div className="relative overflow-hidden p-4 sm:p-5 kbelia-important-header dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-teal-500/80 dark:bg-teal-400/80" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
                <h3 className="text-base font-bold text-black dark:text-white">
                  Pengeluaran Surat Perakuan Rasmi Geran Belia
                </h3>
              </div>
              <p className="text-[0.9375rem] text-black dark:text-white max-w-2xl leading-relaxed">
                Mentor berdaftar boleh menilai usahawan dan mengeluarkan Surat Sokongan Geran. Dokumen bertandatangan rasmi ini diperlukan oleh pihak admin KBelia untuk meluluskan Geran Permulaan (RM3,000) dan Geran Pemangkin (RM5,000).
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsNewEndorsementModalOpen(true)}
              className="interactive-press interactive-lift px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer dark:bg-teal-600"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Keluarkan Perakuan</span>
            </button>
          </div>

          {/* List of Issued Endorsements (Reference Table) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <h4 className="text-sm font-bold text-black dark:text-white">
                  Senarai Surat Perakuan Geran yang Telah Dikeluarkan ({filteredEndorsements.length})
                </h4>
              </div>
              <span className="text-[0.8125rem] text-black/70 dark:text-white/75">
                Disahkan oleh Hab Pembangunan Usahawan Belia Kelantan
              </span>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 overflow-visible shadow-2xs">
              <ReferenceTableToolbar
                accent="teal"
                searchValue={endorsementsSearch}
                onSearchChange={setEndorsementsSearch}
                searchPlaceholder="Cari nama usahawan, kod perakuan atau daerah..."
                filterCount={
                  (endorsementsGrantFilter !== 'all' ? 1 : 0) +
                  (endorsementsSortPreset !== DEFAULT_SORT_VALUE ? 1 : 0)
                }
                onResetFilters={() => {
                  setEndorsementsGrantFilter('all');
                  setEndorsementsSortPreset(DEFAULT_SORT_VALUE);
                }}
                sortOptions={
                  endorsementsSortPreset === 'table_column'
                    ? [{ value: '', label: 'Ikut Lajur Jadual' }, ...endorsementsSortOptions]
                    : endorsementsSortOptions
                }
                sortValue={endorsementsSortPreset === 'table_column' ? '' : endorsementsSortPreset}
                onSortChange={(val) => {
                  if (val) setEndorsementsSortPreset(val);
                }}
                filterContent={
                  <div>
                    <label className="block text-xs font-bold text-black/70 dark:text-white/75 mb-1.5">
                      Jumlah Geran Disyorkan
                    </label>
                    <select
                      value={endorsementsGrantFilter}
                      onChange={(e) => setEndorsementsGrantFilter(e.target.value as 'all' | 'RM3,000' | 'RM5,000' | 'RM10,000')}
                      className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white cursor-pointer"
                    >
                      <option value="all">Semua Peringkat Geran</option>
                      <option value="RM3,000">RM3,000 (Permulaan)</option>
                      <option value="RM5,000">RM5,000 (Pemangkin)</option>
                      <option value="RM10,000">RM10,000 (Skala Besar)</option>
                    </select>
                  </div>
                }
              />

              {filteredEndorsements.length === 0 ? (
                <div className="py-10 text-center text-sm text-black/70 dark:text-white/75">
                  Tiada surat perakuan geran dikeluarkan di bawah seliaan anda bagi carian ini.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 dark:bg-zinc-950/60 border-b border-slate-200 dark:border-zinc-700">
                        <th className="py-3 px-4 text-xs font-semibold text-black/60 dark:text-white/65">
                          <button
                            type="button"
                            onClick={() => {
                              setEndorsementsSortPreset('table_column');
                              if (endorsementsSortBy === 'name') setEndorsementsSortDir(p => p === 'asc' ? 'desc' : 'asc');
                              else { setEndorsementsSortBy('name'); setEndorsementsSortDir('asc'); }
                            }}
                            className="inline-flex items-center gap-1 hover:text-black dark:hover:text-white cursor-pointer"
                          >
                            <span>Usahawan &amp; Kod Perakuan</span>
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="py-3 px-4 text-xs font-semibold text-black/60 dark:text-white/65">
                          Program &amp; Jumlah Geran
                        </th>
                        <th className="py-3 px-4 text-xs font-semibold text-black/60 dark:text-white/65">
                          Daerah
                        </th>
                        <th className="py-3 px-4 text-xs font-semibold text-black/60 dark:text-white/65">
                          <button
                            type="button"
                            onClick={() => {
                              setEndorsementsSortPreset('table_column');
                              if (endorsementsSortBy === 'date') setEndorsementsSortDir(p => p === 'asc' ? 'desc' : 'asc');
                              else { setEndorsementsSortBy('date'); setEndorsementsSortDir('desc'); }
                            }}
                            className="inline-flex items-center gap-1 hover:text-black dark:hover:text-white cursor-pointer"
                          >
                            <span>Tarikh</span>
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="py-3 px-4 text-xs font-semibold text-black/60 dark:text-white/65">
                          Status
                        </th>
                        <th className="py-3 px-4 w-14 text-right text-xs font-semibold text-black/60 dark:text-white/65">
                          <span className="sr-only">Tindakan</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-zinc-700 text-sm">
                      {endorsementsPagination.paginatedItems.map((item) => (
                        <tr key={item.id} className="kbelia-table-row">
                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/70 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                                <Award className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-black dark:text-white truncate">{item.menteeName}</div>
                                <div className="text-xs text-black/60 dark:text-white/60 font-mono truncate">{item.endorsementCode}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="font-medium text-black dark:text-white truncate">{item.businessName}</div>
                            <div className="text-xs text-black/65 dark:text-white/65 truncate">{item.grantProgramTitle} ({item.recommendedAmount})</div>
                          </td>
                          <td className="py-3.5 px-4 text-black/80 dark:text-white/80 whitespace-nowrap">
                            {item.district}
                          </td>
                          <td className="py-3.5 px-4 text-black/75 dark:text-white/75 whitespace-nowrap tabular-nums">
                            {item.issuedAt}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
                              <Check className="w-3 h-3" />
                              <span>Disahkan Rasmi</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <RowActionMenu
                              ariaLabel={`Tindakan surat perakuan ${item.menteeName}`}
                              items={[
                                {
                                  label: 'Lihat & Cetak Surat',
                                  onClick: () => setSelectedEndorsementForView(item),
                                  tone: 'accent'
                                }
                              ]}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {filteredEndorsements.length > 0 && (
                <PaginationBar
                  currentPage={endorsementsPagination.currentPage}
                  totalItems={endorsementsPagination.totalItems}
                  itemsPerPage={7}
                  onPageChange={endorsementsPagination.setCurrentPage}
                  itemLabel="surat perakuan"
                  accent="teal"
                />
              )}
            </div>
          </div>

        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: LOG JURNAL & PELAN TINDAKAN MENTEE                              */}
      {/* ===================================================================== */}
      {currentSubTab === 'logbook' && (
        <div key="logbook" className="space-y-4 animate-dashboard-tab">
          
          <div className="relative overflow-hidden p-4 sm:p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-teal-500/80 dark:bg-teal-400/80" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
                <h3 className="text-base font-bold text-black dark:text-white">
                  Rekod Sesi Bimbingan &amp; Tugasan Usahawan
                </h3>
              </div>
              <p className="text-[0.9375rem] text-black dark:text-white max-w-2xl leading-relaxed">
                Catatkan nota perbincangan sesi bimbingan, sasaran peniaga, dan senarai tugasan penting usahawan. Anda boleh menyemak kemajuan tugasan secara berterusan supaya sasaran bisnes tercapai.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateLogModal}
              className="interactive-press interactive-lift px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer dark:bg-teal-600"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Tambah Rekod Sesi</span>
            </button>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 overflow-visible shadow-2xs">
            <ReferenceTableToolbar
              accent="teal"
              searchValue={logsSearch}
              onSearchChange={setLogsSearch}
              searchPlaceholder="Cari usahawan, topik atau tarikh sesi..."
              filterCount={(logsStatusFilter !== 'all' ? 1 : 0) + (logsSortPreset !== DEFAULT_SORT_VALUE ? 1 : 0)}
              onResetFilters={() => {
                setLogsStatusFilter('all');
                setLogsSortPreset(DEFAULT_SORT_VALUE);
              }}
              sortOptions={
                logsSortPreset === 'table_column'
                  ? [{ value: '', label: 'Ikut Lajur Jadual' }, ...logsSortOptions]
                  : logsSortOptions
              }
              sortValue={logsSortPreset === 'table_column' ? '' : logsSortPreset}
              onSortChange={(val) => {
                if (val) setLogsSortPreset(val);
              }}
              filterContent={
                <div>
                  <label className="block text-xs font-bold text-black/70 dark:text-white/75 mb-1.5">
                    Status Tugasan
                  </label>
                  <select
                    value={logsStatusFilter}
                    onChange={(e) => setLogsStatusFilter(e.target.value as 'all' | 'done' | 'pending')}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white cursor-pointer"
                  >
                    <option value="all">Semua Rekod Sesi</option>
                    <option value="pending">Tugasan Masih Berjalan</option>
                    <option value="done">Semua Tugasan Selesai</option>
                  </select>
                </div>
              }
            />

            {filteredLogs.length === 0 ? (
              <div className="py-10 text-center text-sm text-black/70 dark:text-white/75">
                Belum ada rekod sesi bimbingan untuk usahawan seliaan anda bagi carian ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 dark:bg-zinc-950/60 border-b border-slate-200 dark:border-zinc-700">
                      <th className="py-3 px-4 text-xs font-semibold text-black/60 dark:text-white/65">
                        <button
                          type="button"
                          onClick={() => {
                            setLogsSortPreset('table_column');
                            if (logsSortBy === 'name') setLogsSortDir(p => p === 'asc' ? 'desc' : 'asc');
                            else { setLogsSortBy('name'); setLogsSortDir('asc'); }
                          }}
                          className="inline-flex items-center gap-1 hover:text-black dark:hover:text-white cursor-pointer"
                        >
                          <span>Usahawan &amp; Perniagaan</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="py-3 px-4 text-xs font-semibold text-black/60 dark:text-white/65">
                        Topik Bimbingan
                      </th>
                      <th className="py-3 px-4 text-xs font-semibold text-black/60 dark:text-white/65">
                        <button
                          type="button"
                          onClick={() => {
                            setLogsSortPreset('table_column');
                            if (logsSortBy === 'date') setLogsSortDir(p => p === 'asc' ? 'desc' : 'asc');
                            else { setLogsSortBy('date'); setLogsSortDir('desc'); }
                          }}
                          className="inline-flex items-center gap-1 hover:text-black dark:hover:text-white cursor-pointer"
                        >
                          <span>Tarikh Sesi</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="py-3 px-4 text-xs font-semibold text-black/60 dark:text-white/65">
                        Kemajuan Tugasan
                      </th>
                      <th className="py-3 px-4 w-14 text-right text-xs font-semibold text-black/60 dark:text-white/65">
                        <span className="sr-only">Tindakan</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-zinc-700 text-sm">
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
                        <React.Fragment key={log.id}>
                          <tr
                            onClick={() =>
                              setExpandedLogIds(prev => ({ ...prev, [log.id]: !prev[log.id] }))
                            }
                            className="kbelia-table-row cursor-pointer"
                          >
                            <td className="py-3.5 px-4 max-w-xs">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 shrink-0">
                                  <PortalImage
                                    src={visuals.businessUrl}
                                    alt={log.businessName}
                                    fallbackType="business"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-black dark:text-white truncate">{log.menteeName}</div>
                                  <div className="text-xs text-black/65 dark:text-white/65 truncate">{log.businessName}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-black/85 dark:text-white/85 max-w-xs truncate">
                              {log.topic}
                            </td>
                            <td className="py-3.5 px-4 text-black/75 dark:text-white/75 whitespace-nowrap font-mono tabular-nums">
                              {log.sessionDate}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="inline-flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center text-xs font-bold tabular-nums px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
                                    totalTasks > 0 && doneTasks === totalTasks
                                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                                      : 'bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200'
                                  }`}
                                >
                                  {totalTasks > 0 ? `${doneTasks}/${totalTasks} Tugasan` : 'Direkodkan'}
                                </span>
                                {totalTasks > 0 && (
                                  <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-zinc-700 overflow-hidden hidden sm:block">
                                    <div
                                      className={`h-full rounded-full transition-[width] duration-500 ${
                                        doneTasks === totalTasks ? 'bg-emerald-500' : 'bg-teal-500'
                                      }`}
                                      style={{ width: `${Math.round((doneTasks / totalTasks) * 100)}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                            </td>
                            <td
                              className="py-3.5 px-4 text-right whitespace-nowrap"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <RowActionMenu
                                ariaLabel={`Tindakan log ${log.menteeName}`}
                                items={[
                                  {
                                    label: isExpanded ? 'Tutup Butiran' : 'Lihat Minit & Tugasan',
                                    onClick: () =>
                                      setExpandedLogIds(prev => ({ ...prev, [log.id]: !prev[log.id] })),
                                    tone: 'accent'
                                  },
                                  {
                                    label: 'Sunting Rekod & Tugasan',
                                    onClick: () => openEditLogModal(log)
                                  },
                                  {
                                    label: 'Padam Rekod',
                                    onClick: () => handleDeleteLogEntry(log),
                                    tone: 'danger',
                                    dividerBefore: true
                                  }
                                ]}
                              />
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr className="bg-slate-50/75 dark:bg-zinc-950/40">
                              <td colSpan={5} className="px-4 sm:px-5 py-4 space-y-4">
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <div className="text-sm font-bold text-black dark:text-white">
                                      Ringkasan Minit Bimbingan Mentor:
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => openEditLogModal(log)}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-black dark:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                        <span>Sunting Rekod</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteLogEntry(log)}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Padam Rekod</span>
                                      </button>
                                    </div>
                                  </div>
                                  <p className="text-[0.9375rem] text-black dark:text-white bg-white dark:bg-zinc-900 p-3 rounded-xl border border-slate-200 dark:border-zinc-700 leading-relaxed font-sans">
                                    {log.minutes}
                                  </p>
                                </div>

                                <div className="space-y-2.5">
                                  <div className="text-sm font-bold text-black dark:text-white flex items-center justify-between gap-2 flex-wrap">
                                    <span>Senarai Semak Tugasan Wajib Mentee:</span>
                                    <div className="flex items-center gap-3 flex-wrap">
                                      <span className="text-[0.8125rem] text-black/70 dark:text-white/75 font-normal">
                                        Tekan kotak untuk tandakan selesai, atau sunting terus
                                      </span>
                                      {!inlineNewTaskDrafts[log.id]?.isOpen && (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenInlineNewTask(log.id)}
                                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition-colors cursor-pointer"
                                        >
                                          <Plus className="w-3.5 h-3.5" />
                                          <span>Tambah Tugasan</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {(!log.actionItems || log.actionItems.length === 0) ? (
                                    <div className="p-3 rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-900/50 text-xs text-black/70 dark:text-white/70 flex items-center justify-between gap-2 flex-wrap">
                                      <span>Belum ada tugasan direkodkan untuk sesi ini.</span>
                                      {!inlineNewTaskDrafts[log.id]?.isOpen && (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenInlineNewTask(log.id)}
                                          className="font-bold text-teal-700 dark:text-teal-300 hover:underline cursor-pointer"
                                        >
                                          + Tambah tugasan pertama
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      {log.actionItems.map((task) => {
                                        const isEditingThis =
                                          editingInlineTask?.logId === log.id &&
                                          editingInlineTask?.taskId === task.id;

                                        if (isEditingThis && editingInlineTask) {
                                          return (
                                            <div
                                              key={task.id}
                                              className="p-3 rounded-xl border border-teal-500/70 bg-white dark:bg-zinc-900 space-y-2.5 shadow-xs"
                                            >
                                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                                                <input
                                                  type="text"
                                                  value={editingInlineTask.task}
                                                  onChange={(e) =>
                                                    setEditingInlineTask(prev =>
                                                      prev ? { ...prev, task: e.target.value } : prev
                                                    )
                                                  }
                                                  onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                      e.preventDefault();
                                                      handleSaveInlineTaskEdit();
                                                    } else if (e.key === 'Escape') {
                                                      setEditingInlineTask(null);
                                                    }
                                                  }}
                                                  placeholder="Masukkan penerangan tugasan"
                                                  autoFocus
                                                  className="sm:col-span-2 px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-xl text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600"
                                                />
                                                <ModernDatePicker
                                                  value={editingInlineTask.dueDate}
                                                  onChange={(val) =>
                                                    setEditingInlineTask(prev =>
                                                      prev ? { ...prev, dueDate: val } : prev
                                                    )
                                                  }
                                                  valueFormat="iso"
                                                  accentColor="teal"
                                                  placeholder="Tarikh sasaran"
                                                />
                                              </div>
                                              <div className="flex items-center justify-end gap-2">
                                                <button
                                                  type="button"
                                                  onClick={() => setEditingInlineTask(null)}
                                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-black/75 dark:text-white/75 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                                                >
                                                  Batal
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={handleSaveInlineTaskEdit}
                                                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white cursor-pointer"
                                                >
                                                  Simpan Tugasan
                                                </button>
                                              </div>
                                            </div>
                                          );
                                        }

                                        return (
                                          <div
                                            key={task.id}
                                            className={`p-3 rounded-xl border transition-all flex flex-wrap items-center justify-between gap-3 ${
                                              task.completed
                                                ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-black/70 dark:text-white/75'
                                                : 'bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-700 hover:border-blue-400/70 dark:hover:border-blue-400/70 text-black dark:text-white'
                                            }`}
                                          >
                                            <button
                                              type="button"
                                              onClick={() => handleToggleLogTask(log.id, task.id)}
                                              className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                                            >
                                              <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                                                task.completed
                                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                                  : 'border-slate-300 dark:border-zinc-600 bg-slate-50 dark:bg-zinc-800'
                                              }`}>
                                                {task.completed && <Check className="w-3.5 h-3.5" />}
                                              </div>
                                              <span className={`text-sm font-medium break-words ${task.completed ? 'line-through' : ''}`}>
                                                {task.task}
                                              </span>
                                            </button>

                                            <div className="flex items-center gap-2 shrink-0">
                                              <span className={`text-[0.8125rem] font-mono tabular-nums px-2 py-0.5 rounded ${
                                                task.completed
                                                  ? 'bg-emerald-100 text-black'
                                                  : 'bg-slate-50 dark:bg-zinc-800 text-black dark:text-white border border-slate-300 dark:border-zinc-700'
                                              }`}>
                                                Sasaran: {task.dueDate}
                                              </span>
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleStartInlineTaskEdit(log.id, task);
                                                }}
                                                aria-label={`Sunting tugasan ${task.task}`}
                                                title="Sunting tugasan"
                                                className="p-1.5 rounded-lg text-black/70 dark:text-white/75 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                              >
                                                <Edit3 className="w-3.5 h-3.5" />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleDeleteInlineTask(log.id, task.id);
                                                }}
                                                aria-label={`Padam tugasan ${task.task}`}
                                                title="Padam tugasan"
                                                className="p-1.5 rounded-lg text-black/70 dark:text-white/75 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {inlineNewTaskDrafts[log.id]?.isOpen && (
                                    <div className="p-3 rounded-xl border border-teal-500/70 bg-white dark:bg-zinc-900 space-y-2.5 shadow-xs">
                                      <div className="text-xs font-bold text-black dark:text-white">
                                        Tambah Tugasan Baharu
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                                        <input
                                          type="text"
                                          value={inlineNewTaskDrafts[log.id]?.task || ''}
                                          onChange={(e) =>
                                            setInlineNewTaskDrafts(prev => ({
                                              ...prev,
                                              [log.id]: {
                                                ...(prev[log.id] || { isOpen: true, dueDate: '' }),
                                                task: e.target.value
                                              }
                                            }))
                                          }
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault();
                                              handleSaveInlineNewTask(log.id);
                                            } else if (e.key === 'Escape') {
                                              setInlineNewTaskDrafts(prev => ({
                                                ...prev,
                                                [log.id]: { isOpen: false, task: '', dueDate: '' }
                                              }));
                                            }
                                          }}
                                          placeholder="Masukkan tugasan baharu untuk mentee"
                                          autoFocus
                                          className="sm:col-span-2 px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-xl text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600"
                                        />
                                        <ModernDatePicker
                                          value={inlineNewTaskDrafts[log.id]?.dueDate || ''}
                                          onChange={(val) =>
                                            setInlineNewTaskDrafts(prev => ({
                                              ...prev,
                                              [log.id]: {
                                                ...(prev[log.id] || { isOpen: true, task: '' }),
                                                dueDate: val
                                              }
                                            }))
                                          }
                                          valueFormat="iso"
                                          minDate={toLocalIsoDate(new Date())}
                                          accentColor="teal"
                                          placeholder="Tarikh sasaran"
                                        />
                                      </div>
                                      <div className="flex items-center justify-end gap-2">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setInlineNewTaskDrafts(prev => ({
                                              ...prev,
                                              [log.id]: { isOpen: false, task: '', dueDate: '' }
                                            }))
                                          }
                                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-black/75 dark:text-white/75 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                                        >
                                          Batal
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleSaveInlineNewTask(log.id)}
                                          className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white cursor-pointer"
                                        >
                                          Tambah Tugasan
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {filteredLogs.length > 0 && (
              <PaginationBar
                currentPage={logsPagination.currentPage}
                totalItems={logsPagination.totalItems}
                itemsPerPage={7}
                onPageChange={logsPagination.setCurrentPage}
                itemLabel="rekod sesi"
                accent="teal"
              />
            )}
          </div>

        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: PROFIL MENTOR & JADUAL KELAPANGAN                              */}
      {/* ===================================================================== */}
      {currentSubTab === 'profile' && (
        <div key="profile" className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 p-4 sm:p-5 shadow-2xs space-y-4 animate-dashboard-tab">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-teal-500/80 dark:bg-teal-400/80" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3.5 border-b border-slate-300 dark:border-slate-600">
            <div>
              <h3 className="text-lg font-bold text-black dark:text-white">
                Profil & Maklumat Mentor
              </h3>
              <p className="text-[0.9375rem] text-black dark:text-white/75">
                Maklumat ini dipaparkan kepada usahawan belia yang ingin memohon bimbingan perniagaan.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsEditProfileOpen(true)}
              className="interactive-press interactive-lift px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-sm flex items-center gap-2 cursor-pointer dark:bg-teal-600"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profil Saya</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            <div className="space-y-3.5">
              <div>
                <label className="text-sm font-semibold text-black dark:text-white block mb-1">
                  Nama Penuh
                </label>
                <div className="text-sm font-bold text-black dark:text-white p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600">
                  {currentMentor.name}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-black dark:text-white block mb-1">
                  Jawatan dan Agensi
                </label>
                <div className="text-sm font-medium text-black dark:text-white p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600">
                  {currentMentor.title} &middot; <span className="font-bold text-black dark:text-white/75">{currentMentor.agency}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-black dark:text-white block mb-1">
                  Saluran Perhubungan
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-black dark:text-white p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600">
                    <Phone className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>WhatsApp: +{currentMentor.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-black dark:text-white p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600">
                    <Mail className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>Emel Rasmi: {currentMentor.email}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-sm font-semibold text-black dark:text-white block mb-1">
                  Jadual Bimbingan
                </label>
                <div className="text-sm font-bold text-black dark:text-white p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-black/70 dark:text-white/75" />
                  <span>{currentMentor.availableDays}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-black dark:text-white block mb-1">
                  Bidang Kepakaran
                </label>
                <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600">
                  {currentMentor.expertise.map((exp, idx) => (
                    <span key={idx} className="text-sm font-semibold bg-teal-50 text-black border border-teal-200 dark:bg-teal-950/60 dark:text-white dark:border-teal-800/70 px-3 py-1 rounded-lg">
                      {exp}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-black dark:text-white block mb-1">
                  Ringkasan Profil
                </label>
                <p className="text-[0.9375rem] text-black dark:text-white p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 leading-relaxed font-sans">
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
                  <p className="text-[0.9375rem] text-black/70 dark:text-white/75">
                    Hab Usahawan Belia Kelantan (KBelia) &bull; Panel Bimbingan Mentor
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
                  <label className="block text-sm font-bold text-black dark:text-white mb-1">
                    Nama Penuh *
                  </label>
                  <input
                    type="text"
                    required
                    value={newEndorsementMenteeName}
                    onChange={(e) => setNewEndorsementMenteeName(e.target.value)}
                    placeholder="Masukkan nama penuh"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-sm text-black dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 dark:focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-black dark:text-white mb-1">
                    Nama Perniagaan *
                  </label>
                  <input
                    type="text"
                    required
                    value={newEndorsementBusinessName}
                    onChange={(e) => setNewEndorsementBusinessName(e.target.value)}
                    placeholder="Masukkan nama perniagaan"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-sm text-black dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 dark:focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-black dark:text-white mb-1">
                    Kategori Perniagaan
                  </label>
                  <select
                    value={newEndorsementCategory}
                    onChange={(e) => setNewEndorsementCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-sm text-black dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 dark:focus:border-blue-500"
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
                  <label className="block text-sm font-bold text-black dark:text-white mb-1">
                    Daerah
                  </label>
                  <select
                    value={newEndorsementDistrict}
                    onChange={(e) => setNewEndorsementDistrict(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-sm text-black dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 dark:focus:border-blue-500"
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
                <label className="block text-sm font-bold text-black dark:text-white mb-1">
                  Jenis Geran Bantuan
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
                    <div className="text-[0.8125rem] uppercase font-semibold">Geran Permulaan</div>
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
                    <div className="text-[0.8125rem] uppercase font-semibold">Geran Pemangkin</div>
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
                    <div className="text-[0.8125rem] uppercase font-semibold">Dana Pertumbuhan</div>
                    <div className="text-sm font-black">RM10,000</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-1">
                  Justifikasi Perakuan *
                </label>
                <textarea
                  required
                  rows={3}
                  value={newEndorsementJustification}
                  onChange={(e) => setNewEndorsementJustification(e.target.value)}
                  placeholder="Masukkan justifikasi perakuan"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-sm text-black dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-emerald-600 leading-relaxed font-sans dark:focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-1">
                  Catatan Kesediaan Operasi
                </label>
                <input
                  type="text"
                  value={newEndorsementReadiness}
                  onChange={(e) => setNewEndorsementReadiness(e.target.value)}
                  placeholder="Masukkan catatan kesediaan operasi"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-sm text-black dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-emerald-600 dark:focus:border-blue-500"
                />
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/60 rounded-xl border border-amber-200 dark:border-amber-800/70">
                <label className="flex items-start gap-2.5 text-sm text-black dark:text-white cursor-pointer">
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
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-black dark:text-white/75 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm flex items-center gap-1.5 cursor-pointer dark:bg-blue-600"
                >
                  <Award className="w-4 h-4" />
                  <span>Jana Perakuan</span>
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
              <span className="text-[0.8125rem] font-bold text-black uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-black" />
                Dokumen Rasmi Sokongan Geran Belia
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const html = generateMentorEndorsementOfficialHtml(selectedEndorsementForView);
                    void openAndPrintDocument(html, `Perakuan_Geran_${selectedEndorsementForView.endorsementCode}`);
                  }}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-black border border-slate-300 hover:border-blue-400/70 text-sm font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Rasmi</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const html = generateMentorEndorsementOfficialHtml(selectedEndorsementForView);
                    const ok = await downloadHtmlAsPdf(html, `Perakuan_Geran_${selectedEndorsementForView.endorsementCode}`);
                    if (ok) {
                      triggerToast('Surat perakuan rasmi berjaya dimuat turun sebagai PDF.', 'success');
                    } else {
                      triggerToast('Gagal menjana PDF surat perakuan.', 'error');
                    }
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Muat Turun PDF</span>
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
                <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-black text-xs">
                  KBELIA
                </div>
                <div className="text-left">
                  <h3 className="font-black text-base tracking-tight text-black uppercase">
                    HAB PEMBANGUNAN USAHAWAN BELIA KELANTAN
                  </h3>
                  <p className="text-[0.875rem] font-semibold text-black uppercase tracking-wider">
                    PANEL BIMBINGAN MENTOR &amp; KEUSAHAWANAN &bull; PORTAL KBELIA
                  </p>
                </div>
              </div>
              <p className="text-[0.875rem] text-black/70 pt-1">
                Pusat Operasi Hab Usahawan Belia Kelantan, 15000 Kota Bharu, Kelantan &bull; Tel: +609-771 7000
              </p>
            </div>

            {/* Reference Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[0.8125rem] gap-2 pt-1 font-mono">
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
            <div className="text-sm space-y-1">
              <p className="font-semibold text-black">Kepada:</p>
              <p className="font-bold text-black">Urus Setia Jawatankuasa Penilaian Geran Usahawan Belia Kelantan</p>
              <p className="text-black">Pusat Pembangunan Usahawan Belia & Majlis Tindakan Ekonomi Negeri</p>
            </div>

            {/* Title */}
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
              <h4 className="font-bold text-sm text-black uppercase">
                SURAT PERAKUAN SOKONGAN MENTOR
              </h4>
              <p className="text-[0.9375rem] font-semibold text-black mt-0.5">
                {selectedEndorsementForView.grantProgramTitle} ({selectedEndorsementForView.recommendedAmount})
              </p>
            </div>

            {/* Letter Body */}
            <div className="text-sm text-black space-y-3 leading-relaxed font-serif">
              <p>
                Dengan segala hormatnya dimaklumkan bahawa saya, <strong>{selectedEndorsementForView.mentorName}</strong>, 
                selaku Mentor di bawah <strong>{selectedEndorsementForView.mentorAgency}</strong> telah membimbing dan 
                menilai potensi perniagaan penama di bawah:
              </p>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-300 font-sans space-y-1 text-sm">
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
            <div className="pt-6 border-t border-slate-300 flex flex-col sm:flex-row sm:items-end justify-between gap-4 font-sans text-sm">
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
                  <span className="text-black block">{selectedEndorsementForView.mentorDesignation || 'Mentor'}</span>
                  <span className="text-black/70 block">{selectedEndorsementForView.mentorAgency}</span>
                </div>
              </div>

              <div className="text-center sm:text-right">
                <div className="inline-block p-3 rounded-2xl bg-amber-50 border-2 border-amber-400 text-center">
                  <ShieldCheck className="w-7 h-7 text-black mx-auto mb-1" />
                  <span className="font-black text-[0.8125rem] text-black uppercase tracking-wider block">
                    PENGESAHAN DIGITAL KBELIA
                  </span>
                  <span className="font-mono text-[0.8125rem] text-black/70 block">
                    STATUS: SAH DIPERAKUKAN
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: TAMBAH / SUNTING MINIT LOG JURNAL & TUGASAN MENTEE           */}
      {/* ===================================================================== */}
      {isNewLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-300 dark:border-slate-600 max-h-[92vh] overflow-y-auto overflow-hidden">
            
            <div className="kbelia-important-header px-6 sm:px-7 pt-6 pb-4 flex items-start justify-between gap-4 border-b border-slate-300 dark:border-slate-600">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 dark:bg-indigo-950/60 dark:border-indigo-800/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-black dark:text-white">
                    {editingLogId ? 'Sunting Rekod Sesi Bimbingan' : 'Tambah Rekod Sesi Bimbingan'}
                  </h3>
                  <p className="text-[0.9375rem] text-black/70 dark:text-white/75">
                    {editingLogId
                      ? 'Kemas kini minit perbincangan dan senarai tugasan usahawan'
                      : 'Simpan nota perbincangan dan senarai tugasan usahawan'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsNewLogModalOpen(false);
                  setEditingLogId(null);
                }}
                className="p-1.5 rounded-lg text-black/70 dark:text-white/75 hover:text-black hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLogEntry} className="px-6 sm:px-7 pb-6 sm:pb-7 pt-4 space-y-3.5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-black dark:text-white mb-1">
                    Nama Usahawan *
                  </label>
                  <input
                    type="text"
                    required
                    value={newLogMenteeName}
                    onChange={(e) => setNewLogMenteeName(e.target.value)}
                    placeholder="Masukkan nama usahawan"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-sm text-black dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 dark:focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-black dark:text-white mb-1">
                    Nama Perniagaan *
                  </label>
                  <input
                    type="text"
                    required
                    value={newLogBusinessName}
                    onChange={(e) => setNewLogBusinessName(e.target.value)}
                    placeholder="Masukkan nama perniagaan"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-sm text-black dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 dark:focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold text-black dark:text-white mb-1">
                    Topik Bimbingan *
                  </label>
                  <input
                    type="text"
                    required
                    value={newLogTopic}
                    onChange={(e) => setNewLogTopic(e.target.value)}
                    placeholder="Masukkan topik bimbingan"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-sm text-black dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 dark:focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-black dark:text-white mb-1">
                    Tarikh Sesi
                  </label>
                  <ModernDatePicker
                    value={newLogSessionDate}
                    onChange={setNewLogSessionDate}
                    valueFormat="iso"
                    accentColor="teal"
                    placeholder="Tarikh sesi"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-1">
                  Ringkasan Perbincangan *
                </label>
                <textarea
                  required
                  rows={3}
                  value={newLogMinutes}
                  onChange={(e) => setNewLogMinutes(e.target.value)}
                  placeholder="Masukkan ringkasan perbincangan"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-sm text-black dark:text-white font-sans leading-relaxed focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-emerald-600 dark:focus:border-blue-500"
                />
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-300 dark:border-slate-600">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <label className="block text-sm font-bold text-black dark:text-white">
                      Senarai Tugasan ({newLogTasks.length})
                    </label>
                    <p className="text-xs text-black/65 dark:text-white/65">
                      Tambah, sunting, atau padam seberapa banyak tugasan untuk sesi ini.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddModalTaskRow}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-2xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Tugasan</span>
                  </button>
                </div>

                {newLogTasks.length === 0 ? (
                  <div className="p-3.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50/70 dark:bg-slate-800/40 text-xs text-black/70 dark:text-white/75 flex flex-wrap items-center justify-between gap-2">
                    <span>Tiada tugasan ditambah. Tekan Tambah Tugasan jika ada tindakan susulan.</span>
                    <button
                      type="button"
                      onClick={handleAddModalTaskRow}
                      className="font-bold text-teal-700 dark:text-teal-300 hover:underline shrink-0 cursor-pointer"
                    >
                      + Tambah Baris
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {newLogTasks.map((taskRow, idx) => (
                      <div
                        key={taskRow.id}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {editingLogId && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateModalTaskRow(taskRow.id, { completed: !taskRow.completed })
                                }
                                title={taskRow.completed ? 'Tandakan belum selesai' : 'Tandakan selesai'}
                                className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                                  taskRow.completed
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                                }`}
                              >
                                {taskRow.completed && <Check className="w-3.5 h-3.5" />}
                              </button>
                            )}
                            <span className="text-xs font-bold text-black/70 dark:text-white/75">
                              Tugasan #{idx + 1}
                              {taskRow.completed ? ' (Selesai)' : ''}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveModalTaskRow(taskRow.id)}
                            aria-label={`Padam tugasan ${idx + 1}`}
                            title="Padam baris tugasan"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Padam</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                          <input
                            type="text"
                            value={taskRow.task}
                            onChange={(e) =>
                              handleUpdateModalTaskRow(taskRow.id, { task: e.target.value })
                            }
                            placeholder={`Masukkan tugasan ke-${idx + 1}`}
                            className="sm:col-span-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 dark:focus:border-blue-500"
                          />
                          <ModernDatePicker
                            value={taskRow.dueDate}
                            onChange={(val) =>
                              handleUpdateModalTaskRow(taskRow.id, { dueDate: val })
                            }
                            valueFormat="iso"
                            minDate={editingLogId ? undefined : toLocalIsoDate(new Date())}
                            accentColor="teal"
                            placeholder="Tarikh sasaran"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-300 dark:border-slate-600 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewLogModalOpen(false);
                    setEditingLogId(null);
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-black dark:text-white/75 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm cursor-pointer dark:bg-blue-600"
                >
                  {editingLogId ? 'Simpan Perubahan' : 'Simpan Rekod Sesi'}
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
                  <p className="text-[0.9375rem] text-black/70 dark:text-white/75">
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
                <label className="block text-sm font-bold text-black dark:text-white mb-1">
                  Pelan Tindakan
                </label>
                <textarea
                  rows={4}
                  value={actionPlanInput}
                  onChange={(e) => setActionPlanInput(e.target.value)}
                  placeholder="Masukkan pelan tindakan"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-sm text-black dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 leading-relaxed font-sans dark:focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-1">
                  Catatan Mentor
                </label>
                <textarea
                  rows={2}
                  value={mentorNotesInput}
                  onChange={(e) => setMentorNotesInput(e.target.value)}
                  placeholder="Masukkan catatan mentor"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-sm text-black dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 dark:focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-1">
                  Pautan Google Meet
                </label>
                <input
                  type="url"
                  value={meetLinkInput}
                  onChange={(e) => setMeetLinkInput(e.target.value)}
                  placeholder="Masukkan pautan Google Meet"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-sm text-black dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 dark:focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-300 dark:border-slate-600 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMenteeForNotes(null)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-black dark:text-white/75 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm flex items-center gap-1.5 cursor-pointer dark:bg-blue-600"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Simpan Nota</span>
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
                <label className="block text-sm font-medium text-black dark:text-white mb-1">
                  Tarikh Sesi
                </label>
                <ModernDatePicker
                  value={newSlotDate}
                  onChange={setNewSlotDate}
                  valueFormat="malay-day"
                  minDate={toLocalIsoDate(new Date())}
                  accentColor="teal"
                  placeholder="Pilih tarikh sesi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-1">
                  Masa Sesi
                </label>
                <ModernTimePicker
                  value={newSlotTime}
                  onChange={setNewSlotTime}
                  mode="range"
                  allowRangeToggle
                  formatStyle="12h-am"
                  defaultDurationMinutes={60}
                  accentColor="teal"
                  placeholder="Pilih masa sesi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-1">
                  Mod Sesi
                </label>
                <select
                  value={newSlotMode}
                  onChange={(e) => setNewSlotMode(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-sm text-black dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 dark:focus:border-blue-500"
                >
                  <option value="Bersemuka di Kampus">Bersemuka di Hab Usahawan (Bilik Bimbingan KBelia)</option>
                  <option value="Google Meet">Google Meet</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-300 dark:border-slate-600 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewSlotModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-black dark:text-white/75 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!newSlotDate.trim() || !newSlotTime.trim()) {
                      triggerToast('Sila masukkan tarikh dan masa sesi bimbingan.', 'warning');
                      return;
                    }
                    const newSlot: PublishedMentorSlot = {
                      id: `slot-${Date.now()}`,
                      date: newSlotDate.trim(),
                      time: newSlotTime.trim(),
                      mode: newSlotMode,
                      createdAt: new Date().toISOString()
                    };
                    const slotStorageKey = `kbelia_mentor_published_slots_${currentMentor.id}`;
                    let existingLocal: PublishedMentorSlot[] = [];
                    try {
                      const raw = localStorage.getItem(slotStorageKey);
                      if (raw) existingLocal = JSON.parse(raw);
                    } catch {
                      // ignore
                    }
                    const mergedSlots = [
                      newSlot,
                      ...(currentMentor.publishedSlots || []),
                      ...existingLocal
                    ].filter((slot, idx, arr) =>
                      arr.findIndex(s => s.date === slot.date && s.time === slot.time) === idx
                    ).slice(0, 50);

                    try {
                      localStorage.setItem(slotStorageKey, JSON.stringify(mergedSlots));
                    } catch {
                      // ignore
                    }

                    const updatedMentor: MentorProfile = {
                      ...currentMentor,
                      publishedSlots: mergedSlots
                    };
                    void saveMentorProfileRecord(updatedMentor).catch(console.error);
                    onUpdateMentor?.(updatedMentor);
                    setNewSlotDate('');
                    setIsNewSlotModalOpen(false);
                    showToast(`Slot bimbingan "${newSlot.date} (${newSlot.time})" berjaya diterbitkan!`);
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm cursor-pointer dark:bg-teal-600"
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
