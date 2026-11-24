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
  BarChart3,
  ClipboardCheck,
  Search,
  MessageCircle
} from 'lucide-react';
import { 
  MentorProfile, 
  MentorshipRegistration, 
  KelantanDistrict, 
  MentorSubTab, 
  GrantEndorsementLetter, 
  MentoringLogEntry,
  MenteeGrantCheck,
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
  broadcastSyncUpdate,
  mergeUniqueById,
  subscribeCrossTabSync,
  subscribeDemoSyncCollection
} from '../services/realtimeSync';
import {
  openAndPrintDocument,
  generateMentorEndorsementOfficialHtml,
  generateMentorSummaryReportHtml
} from '../utils/printUtils';
import { downloadHtmlAsPdf } from '../utils/pdfGenerator';
import { useAuth } from '../context/AuthContext';
import { useConfirmDelete } from '../context/ConfirmDeleteContext';
import { useLanguage } from '../context/LanguageContext';
import { MentorProfileEditModal } from './MentorProfileEditModal';
import { MentorScheduleCalendar } from './MentorScheduleCalendar';
import { emitAdminOrMentorNotification } from '../services/notificationStore';
import { showToast as triggerToast } from './ToastNotification';
import { EditorialMetricStrip } from './EditorialMetricStrip';
import { getRoleTheme } from '../utils/roleTheme';
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

const mentorTheme = getRoleTheme('mentor');

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
    justification: 'Usahawan menunjukkan komitmen tinggi dengan rekod jualan tunai konsisten melebihi RM4,200 sebulan. Penggunaan mesin retort pembungkusan akan memanjangkan jangka hayat sambal dan sedia dipasarkan di Kiosk Belia Kota Bharu Sentral.',
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

  // New Simple Mentor Tabs State: Senarai Mentee & Semak Geran
  const [menteeSearch, setMenteeSearch] = useState('');
  const [menteeDistrictFilter, setMenteeDistrictFilter] = useState<'all' | KelantanDistrict>('all');
  const [readinessSearch, setReadinessSearch] = useState('');
  const [selectedCheckMenteeKey, setSelectedCheckMenteeKey] = useState<string>('');
  const [grantChecks, setGrantChecks] = useState<MenteeGrantCheck[]>(() => {
    try {
      const saved = localStorage.getItem('kbelia_mentor_grant_checks_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });
  const [draftGrantCheck, setDraftGrantCheck] = useState<{
    hasSsm: boolean;
    hasSalesRecord: boolean;
    attendedSession: boolean;
    productReady: boolean;
    notes: string;
  }>({
    hasSsm: false,
    hasSalesRecord: false,
    attendedSession: false,
    productReady: false,
    notes: ''
  });

  // Strictly scoped registrations, endorsements & logs for the authenticated mentor ONLY
  const mentorRegistrations = registrations.filter(r => r.mentorId === currentMentor.id);
  const mentorEndorsements = endorsements.filter(e => e.mentorId === currentMentor.id);
  const mentorLogs = logEntries.filter(l => l.mentorId === currentMentor.id);

  // Unified simple Mentee Directory combining registrations, businesses, logs, endorsements & grant checks
  const menteeDirectory = React.useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        menteeName: string;
        businessName: string;
        category: string;
        district: KelantanDistrict;
        phone: string;
        ssmNumber: string;
        completedSessions: number;
        totalSessions: number;
        totalLogs: number;
        hasEndorsement: boolean;
        latestDate: string;
        latestTopic: string;
      }
    >();

    for (const reg of mentorRegistrations) {
      if (reg.status === 'cancelled') continue;
      const key = (reg.businessName || reg.entrepreneurName || reg.id).trim().toLowerCase();
      const matchedBiz = businesses.find(
        (b) =>
          (reg.applicantId && b.ownerId === reg.applicantId) ||
          b.businessName?.trim().toLowerCase() === reg.businessName?.trim().toLowerCase()
      );
      const existing = map.get(key);
      const isCompleted = reg.status === 'completed';

      if (!existing) {
        const logsCount = mentorLogs.filter(
          (l) => l.businessName?.trim().toLowerCase() === reg.businessName?.trim().toLowerCase()
        ).length;
        const endorsed = mentorEndorsements.some(
          (e) =>
            e.status === 'active' &&
            e.businessName?.trim().toLowerCase() === reg.businessName?.trim().toLowerCase()
        );
        map.set(key, {
          key,
          menteeName: reg.entrepreneurName,
          businessName: reg.businessName,
          category: reg.businessCategory || matchedBiz?.category || 'Umum',
          district: (reg.district || matchedBiz?.district || 'Kota Bharu') as KelantanDistrict,
          phone: reg.entrepreneurPhone || matchedBiz?.whatsapp || matchedBiz?.ownerPhone || '',
          ssmNumber: matchedBiz?.ssmNumber || '',
          completedSessions: isCompleted ? 1 : 0,
          totalSessions: 1,
          totalLogs: logsCount,
          hasEndorsement: endorsed,
          latestDate: reg.preferredDate || '',
          latestTopic: reg.topic || ''
        });
      } else {
        existing.totalSessions += 1;
        if (isCompleted) existing.completedSessions += 1;
        if (!existing.phone && (reg.entrepreneurPhone || matchedBiz?.whatsapp)) {
          existing.phone = reg.entrepreneurPhone || matchedBiz?.whatsapp || '';
        }
        if (!existing.ssmNumber && matchedBiz?.ssmNumber) {
          existing.ssmNumber = matchedBiz.ssmNumber;
        }
        if (reg.preferredDate && (!existing.latestDate || reg.preferredDate > existing.latestDate)) {
          existing.latestDate = reg.preferredDate;
          existing.latestTopic = reg.topic || existing.latestTopic;
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => a.menteeName.localeCompare(b.menteeName));
  }, [mentorRegistrations, businesses, mentorLogs, mentorEndorsements]);

  const activeCheckMentee =
    menteeDirectory.find((m) => m.key === selectedCheckMenteeKey) || menteeDirectory[0] || null;

  useEffect(() => {
    if (!activeCheckMentee) return;
    const saved = grantChecks.find(
      (c) => c.mentorId === currentMentor.id && c.menteeKey === activeCheckMentee.key
    );
    if (saved) {
      setDraftGrantCheck({
        hasSsm: saved.hasSsm,
        hasSalesRecord: saved.hasSalesRecord,
        attendedSession: saved.attendedSession,
        productReady: saved.productReady,
        notes: saved.notes || ''
      });
    } else {
      setDraftGrantCheck({
        hasSsm: Boolean(activeCheckMentee.ssmNumber?.trim()),
        hasSalesRecord: false,
        attendedSession: activeCheckMentee.completedSessions > 0 || activeCheckMentee.totalLogs > 0,
        productReady: Boolean(activeCheckMentee.ssmNumber?.trim() && activeCheckMentee.completedSessions > 0),
        notes: ''
      });
    }
  }, [activeCheckMentee?.key, currentMentor.id, grantChecks]);

  const saveMenteeGrantCheck = (silent = false) => {
    if (!activeCheckMentee) return null;
    const record: MenteeGrantCheck = {
      id: `gchk-${currentMentor.id}-${activeCheckMentee.key.replace(/[^a-z0-9]/g, '-')}`,
      mentorId: currentMentor.id,
      menteeKey: activeCheckMentee.key,
      menteeName: activeCheckMentee.menteeName,
      businessName: activeCheckMentee.businessName,
      district: activeCheckMentee.district,
      hasSsm: draftGrantCheck.hasSsm,
      hasSalesRecord: draftGrantCheck.hasSalesRecord,
      attendedSession: draftGrantCheck.attendedSession,
      productReady: draftGrantCheck.productReady,
      notes: draftGrantCheck.notes.trim(),
      updatedAt: new Date().toISOString()
    };
    const next = [record, ...grantChecks.filter((c) => c.id !== record.id)];
    setGrantChecks(next);
    try {
      localStorage.setItem('kbelia_mentor_grant_checks_v1', JSON.stringify(next));
    } catch {
      // ignore
    }
    broadcastSyncUpdate('all');
    if (!silent) {
      triggerToast(`Semakan geran untuk ${activeCheckMentee.menteeName} disimpan.`, 'success');
    }
    return record;
  };

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

  const handleOpenCreateSlotWithPrefill = (prefillDate?: string, prefillTime?: string) => {
    if (prefillDate) setNewSlotDate(prefillDate);
    if (prefillTime) setNewSlotTime(prefillTime);
    setIsNewSlotModalOpen(true);
  };

  const handleDeletePublishedSlot = (slotId: string) => {
    const slotStorageKey = `kbelia_mentor_published_slots_${currentMentor.id}`;
    let existingLocal: PublishedMentorSlot[] = [];
    try {
      const raw = localStorage.getItem(slotStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) existingLocal = parsed;
      }
    } catch {
      // ignore
    }
    const merged = [...(currentMentor.publishedSlots || []), ...existingLocal].filter(
      (slot, idx, arr) =>
        slot &&
        slot.id !== slotId &&
        arr.findIndex((s) => s.id === slot.id || (s.date === slot.date && s.time === slot.time)) === idx
    );
    try {
      localStorage.setItem(slotStorageKey, JSON.stringify(merged));
    } catch {
      // ignore
    }
    const updatedMentor: MentorProfile = {
      ...currentMentor,
      publishedSlots: merged
    };
    void saveMentorProfileRecord(updatedMentor).catch(console.error);
    onUpdateMentor?.(updatedMentor);
    showToast(!isEn ? 'Slot bimbingan terbuka berjaya dipadam.' : 'Open mentorship slot removed.');
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

  const openCreateLogForMentee = (menteeName: string, businessName: string) => {
    setEditingLogId(null);
    setNewLogMenteeName(menteeName);
    setNewLogBusinessName(businessName);
    setNewLogSessionDate(toLocalIsoDate(new Date()));
    setNewLogTopic('');
    setNewLogMinutes('');
    setNewLogTasks([createEmptyTaskDraft(1), createEmptyTaskDraft(2)]);
    handleSubTabChange('logbook');
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
        <div className={`rounded-3xl p-6 sm:p-10 border backdrop-blur-xs text-center space-y-6 ${mentorTheme.surfaceClass}`}>
          <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mx-auto ${mentorTheme.surfaceMutedClass} ${mentorTheme.dividerClass} ${mentorTheme.accentTextClass}`}>
            <Lock className="w-8 h-8" />
          </div>

          <div className="max-w-xl mx-auto space-y-2">
            <p className={`text-xs font-semibold tracking-wide uppercase ${mentorTheme.accentTextClass}`}>
              Akses Eksklusif Peranan Mentor
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-[#F1F6FA] tracking-tight">
              Ruang Bimbingan &amp; Perkongsian Mentor
            </h2>
            <p className="text-[0.9375rem] text-slate-600 dark:text-slate-300 leading-relaxed">
              Bahagian ini disediakan untuk <strong>Mentor Dalaman &amp; Pakar Industri Berdaftar</strong> menguruskan sesi bimbingan usahawan, berkongsi nota susulan, serta mengeluarkan surat sokongan rasmi.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => openLoginModal('mentor')}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer ${mentorTheme.primaryButtonClass}`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Log Masuk Mentor</span>
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

      {/* 1. MENTOR PORTAL HEADER: Nilam & Sian Editorial */}
      <div className={`relative overflow-hidden kbelia-ambient-sheen-soft rounded-2xl border backdrop-blur-xs p-5 sm:p-6 transition-colors ${mentorTheme.surfaceClass}`}>
        <div className="pointer-events-none absolute -top-14 -right-10 w-56 h-56 rounded-full bg-[#2563EB]/8 dark:bg-[#22D3EE]/8 blur-3xl" aria-hidden="true" />
        {/* Whisper-quiet geometric architectural lines on the right */}
        <svg
          aria-hidden="true"
          viewBox="0 0 320 180"
          fill="none"
          className="pointer-events-none absolute right-0 top-0 h-full w-72 text-[#2563EB]/10 dark:text-[#38BDF8]/10"
          preserveAspectRatio="none"
        >
          <path d="M120 0L240 180M165 0L285 180M210 0L320 165M255 0L320 98M75 180L195 0" stroke="currentColor" strokeWidth="1" />
          <circle cx="268" cy="36" r="52" stroke="currentColor" strokeWidth="1" />
        </svg>

        {(() => {
          const mentorDisplayName = currentMentor?.name || userProfile?.fullName || 'Mentor';
          const scheduleLabel = currentMentor?.availableDays || (!isEn ? 'Isnin–Jumaat · 9:00 PG' : 'Mon–Fri · 9:00 AM');

          const mentorHeaderMap: Record<MentorSubTab, { prefix: string; accent: string }> = {
            overview: {
              prefix: !isEn ? 'Gambaran Keseluruhan ' : 'Mentorship ',
              accent: !isEn ? 'Bimbingan' : 'Overview'
            },
            sessions: {
              prefix: !isEn ? 'Pengurusan ' : 'Manage ',
              accent: !isEn ? 'Sesi Bimbingan' : 'Coaching Sessions'
            },
            mentees: {
              prefix: !isEn ? 'Senarai ' : 'Mentee ',
              accent: !isEn ? 'Mentee' : 'Directory'
            },
            schedule: {
              prefix: !isEn ? 'Pengurusan ' : 'Manage ',
              accent: !isEn ? 'Jadual & Kalendar' : 'Schedule & Calendar'
            },
            readiness: {
              prefix: !isEn ? 'Semak ' : 'Grant ',
              accent: !isEn ? 'Geran' : 'Check'
            },
            endorsements: {
              prefix: !isEn ? 'Pengeluaran ' : 'Issue ',
              accent: !isEn ? 'Sokongan Usahawan' : 'Support Letters'
            },
            logbook: {
              prefix: !isEn ? 'Catatan & ' : 'Session ',
              accent: !isEn ? 'Perkongsian Sesi' : 'Notes & Follow-up'
            },
            impact: {
              prefix: !isEn ? 'Laporan ' : 'Summary ',
              accent: !isEn ? 'Ringkas' : 'Report'
            },
            profile: {
              prefix: !isEn ? 'Pengurusan ' : 'Manage ',
              accent: !isEn ? 'Profil Mentor' : 'Mentor Profile'
            }
          };
          const currentMentorHeader = mentorHeaderMap[currentSubTab] || mentorHeaderMap.overview;
          const targetActionTab: MentorSubTab =
            currentSubTab === 'overview'
              ? 'sessions'
              : 'overview';
          const actionLabel =
            currentSubTab === 'overview'
              ? (!isEn ? 'Semak Sesi' : 'Review Sessions')
              : 'Dashboard';

          return (
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left Editorial Zone */}
              <div className="min-w-0">
                <p className={`text-xs sm:text-[13px] font-semibold tracking-tight ${mentorTheme.accentTextClass}`}>
                  {!isEn ? 'Ruang Bimbingan & Perkongsian' : 'Mentorship & Sharing Space'}
                </p>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-[#F1F6FA] mt-1 leading-tight">
                  {currentMentorHeader.prefix}
                  <span className={mentorTheme.accentTextClass}>{currentMentorHeader.accent}</span>
                </h1>
                <p className="text-[0.9375rem] text-slate-600 dark:text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
                  {!isEn ? (
                    <>
                      Selamat kembali, <span className="font-semibold text-slate-900 dark:text-[#F1F6FA]">{mentorDisplayName}</span> &middot; {scheduleLabel}
                    </>
                  ) : (
                    <>
                      Welcome back, <span className="font-semibold text-slate-900 dark:text-[#F1F6FA]">{mentorDisplayName}</span> &middot; {scheduleLabel}
                    </>
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleSubTabChange(targetActionTab)}
                className={`self-start lg:self-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-2xs ${mentorTheme.primaryButtonClass}`}
              >
                {actionLabel}
              </button>
            </div>
          );
        })()}
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
            name: 'Tahap Asas (RM3,000)',
            value: tier3kCount,
            color: mentorTheme.chartPrimary,
            secondaryLabel: `RM ${(tier3kCount * 3000).toLocaleString('ms-MY')}`
          },
          {
            name: 'Tahap Sederhana (RM5,000)',
            value: tier5kCount,
            color: mentorTheme.chartSecondary,
            secondaryLabel: `RM ${(tier5kCount * 5000).toLocaleString('ms-MY')}`
          },
          {
            name: 'Tahap Lanjutan (RM10,000)',
            value: tier10kCount,
            color: '#94A3B8',
            secondaryLabel: `RM ${(tier10kCount * 10000).toLocaleString('ms-MY')}`
          }
        ];

        return (
        <div className="space-y-4 animate-in fade-in duration-200">

          {/* Open Editorial 4-Column Summary Strip (Nilam & Sian) */}
          <EditorialMetricStrip
            role="mentor"
            items={[
              {
                id: 'mentor-mentees',
                label: !isEn ? 'Usahawan Dibimbing' : 'Entrepreneurs Guided',
                value: totalMentees,
                summary: !isEn
                  ? `${pendingCount} menunggu maklum balas`
                  : `${pendingCount} awaiting response`,
                highlightTone: 'primary',
                onClick: () => handleSubTabChange('sessions')
              },
              {
                id: 'mentor-sessions',
                label: !isEn ? 'Sesi Dijadualkan' : 'Scheduled Sessions',
                value: confirmedCount,
                summary: !isEn ? 'Dalam talian & bersemuka' : 'Online & in-person',
                highlightTone: 'secondary',
                onClick: () => handleSubTabChange('sessions')
              },
              {
                id: 'mentor-endorsements',
                label: !isEn ? 'Sokongan Disahkan' : 'Verified Support',
                value: totalEndorsementsCount,
                summary: !isEn ? 'Disyorkan untuk fasa seterusnya' : 'Recommended for next phase',
                highlightTone: 'neutral',
                onClick: () => handleSubTabChange('endorsements')
              },
              {
                id: 'mentor-notes',
                label: !isEn ? 'Catatan Bimbingan' : 'Coaching Notes',
                value: totalLogbookCount,
                summary: !isEn ? 'Perkongsian & panduan susulan' : 'Follow-up notes & guidance',
                highlightTone: 'neutral',
                onClick: () => handleSubTabChange('logbook')
              }
            ]}
          />

          {/* [2] Seksyen Analitik 2:1 — Graf Taburan Negeri (2 Bahagian) + Donat Pecahan Tahap Sokongan (1 Bahagian) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 items-stretch">
            <div
              style={{ '--stagger': 4 } as React.CSSProperties}
              className={`animate-dashboard-card lg:col-span-2 h-full w-full rounded-2xl p-4 sm:p-5 border backdrop-blur-xs transition-all duration-200 min-w-0 flex flex-col justify-between ${mentorTheme.surfaceClass}`}
            >
              <div className={`flex flex-wrap items-center justify-between gap-2 pb-3 border-b mb-3 ${mentorTheme.dividerClass}`}>
                <div className="flex items-center gap-2.5">
                  <BarChart3 className={`w-5 h-5 shrink-0 ${mentorTheme.accentTextClass}`} />
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F1F6FA] tracking-tight">
                    Perkembangan Bimbingan Mengikut Lokasi
                  </h3>
                </div>
                <span className={`text-[0.8125rem] font-medium ${mentorTheme.accentTextClass}`}>
                  Rangkaian Seluruh Negeri Kelantan
                </span>
              </div>

              <div className="h-[220px] w-full min-w-0 [&_.recharts-cartesian-axis-tick_text]:fill-slate-600 dark:[&_.recharts-cartesian-axis-tick_text]:fill-slate-300">
                <ResponsiveContainer width="100%" height={220} minWidth={0} initialDimension={{ width: 640, height: 220 }}>
                  <BarChart
                    data={mentorChartData}
                    barCategoryGap="16%"
                    barGap={4}
                    margin={{ top: 24, right: 12, left: -4, bottom: 6 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.20)" />
                    <XAxis dataKey="district" tick={{ fontSize: 12.5, fontWeight: 600 }} interval={0} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, (dataMax: number) => Math.max(dataMax, 4)]} allowDecimals={false} tick={{ fontSize: 13, fontWeight: 500 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(37, 99, 235, 0.12)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload as { fullName?: string; district: string; sesi: number; perakuan: number };
                          return (
                            <div className={`px-3.5 py-2.5 rounded-xl text-sm font-mono shadow-xl border ${mentorTheme.tooltipBgClass}`}>
                              <div className="font-bold mb-1">{d.fullName || d.district}</div>
                              <div className="opacity-90">Sesi Bimbingan: {d.sesi}</div>
                              <div className="opacity-90">Sokongan Disyor: {d.perakuan}</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="sesi"
                      name="Sesi Bimbingan"
                      fill={mentorTheme.chartPrimary}
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
                        className="fill-slate-800 dark:fill-slate-100 font-mono"
                        style={{ fontSize: 12, fontWeight: 700 }}
                      />
                    </Bar>
                    <Bar
                      dataKey="perakuan"
                      name="Sokongan Disyor"
                      fill={mentorTheme.chartSecondary}
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
                        className="fill-slate-800 dark:fill-slate-100 font-mono"
                        style={{ fontSize: 12, fontWeight: 700 }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <RoleDonutCard
              className="lg:col-span-1 h-full"
              role="mentor"
              title="Pecahan Tahap Sokongan"
              icon={Award}
              segments={endorsementTierSegments}
              centerValue={centerEndorsedDisplay}
              centerLabel="Jumlah Disyor"
              valueUnit="rekod"
              summaryPairs={[
                { label: 'Sokongan Aktif', value: `${activeEndorsementsList.length} rekod`, dotColor: mentorTheme.chartPrimary },
                { label: 'Purata Nilai', value: `RM ${avgEndorsedRm.toLocaleString('ms-MY')}`, dotColor: mentorTheme.chartSecondary }
              ]}
              emptyState={{
                title: 'Tiada Sokongan Aktif',
                description: 'Keluarkan syor sokongan untuk memaparkan pecahan tahap asas, sederhana dan lanjutan.',
                actionLabel: 'Buka Sokongan',
                onAction: () => handleSubTabChange('endorsements')
              }}
              staggerIndex={5}
            />
          </div>

          {/* [3] Dua Lajur Ringkasan Seimbang Tanpa Kotak Bertindih */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-start">

            {/* Lajur Kiri: Jadual Sesi Terdekat */}
            <div
              style={{ '--stagger': 5 } as React.CSSProperties}
              className={`animate-dashboard-card min-w-0 rounded-2xl p-4 sm:p-5 border backdrop-blur-xs transition-all duration-200 flex flex-col justify-start ${mentorTheme.surfaceClass}`}
            >
              <div className={`flex items-center gap-2.5 pb-3 border-b mb-1 ${mentorTheme.dividerClass}`}>
                <Calendar className={`w-4.5 h-4.5 shrink-0 ${mentorTheme.accentTextClass}`} />
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F1F6FA] tracking-tight">
                  Jadual Sesi Terdekat
                </h3>
              </div>

              <div className={`divide-y ${mentorTheme.dividerClass}`}>
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
                  const statusTone =
                    reg.status === 'confirmed'
                      ? mentorTheme.accentStrongTextClass
                      : reg.status === 'completed'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400';

                  return (
                    <div
                      key={reg.id}
                      className="py-3.5 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className={`w-12 h-12 rounded-xl overflow-hidden border bg-slate-100 dark:bg-slate-900 shrink-0 mt-0.5 ${mentorTheme.dividerClass}`}>
                          <PortalImage
                            src={visuals.businessUrl}
                            alt={reg.businessName}
                            fallbackType="business"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-slate-900 dark:text-[#F1F6FA] leading-snug break-words">
                              {reg.entrepreneurName}
                            </span>
                            <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">&middot;</span>
                            <span className={`text-xs font-semibold shrink-0 ${statusTone}`}>
                              {reg.status === 'confirmed' ? 'Disahkan' : reg.status === 'completed' ? 'Selesai' : 'Menunggu'}
                            </span>
                          </div>
                          <p className="text-[0.875rem] text-slate-600 dark:text-slate-300 leading-relaxed break-words">
                            {reg.businessName} &middot; <span className="font-medium text-slate-900 dark:text-[#F1F6FA]">{reg.district}</span>
                          </p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                            <Clock className="w-3 h-3 shrink-0" />
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
                            className={`px-3.5 py-2 rounded-xl text-[0.8125rem] font-semibold shadow-2xs ${mentorTheme.primaryButtonClass}`}
                          >
                            Sahkan
                          </button>
                        ) : reg.meetingLink ? (
                          <a
                            href={reg.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`px-3.5 py-2 rounded-xl text-[0.8125rem] font-semibold inline-flex items-center gap-1.5 shadow-2xs ${mentorTheme.primaryButtonClass}`}
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Google Meet</span>
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSubTabChange('sessions')}
                            className={`px-3.5 py-2 rounded-xl text-[0.8125rem] font-semibold ${mentorTheme.secondaryButtonClass}`}
                          >
                            Butiran
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {mentorRegistrations.length === 0 && (
                  <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    Tiada temujanji aktif buat masa ini.
                  </div>
                )}
              </div>
            </div>

            {/* Lajur Kanan: Senarai Sokongan Terkini */}
            <div
              style={{ '--stagger': 6 } as React.CSSProperties}
              className={`animate-dashboard-card min-w-0 rounded-2xl p-4 sm:p-5 border backdrop-blur-xs transition-all duration-200 flex flex-col justify-start ${mentorTheme.surfaceClass}`}
            >
              <div className={`flex items-center gap-2.5 pb-3 border-b mb-1 ${mentorTheme.dividerClass}`}>
                <Award className={`w-4.5 h-4.5 shrink-0 ${mentorTheme.accentStrongTextClass}`} />
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F1F6FA] tracking-tight">
                  Senarai Sokongan Terkini
                </h3>
              </div>

              <div className={`divide-y ${mentorTheme.dividerClass}`}>
                {mentorEndorsements.slice(0, 3).map((end) => (
                  <div
                    key={end.id}
                    className="py-3.5 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-900 dark:text-[#F1F6FA] leading-snug break-words">
                          {end.menteeName}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">&middot;</span>
                        <span className={`text-xs font-mono font-semibold tabular-nums shrink-0 ${mentorTheme.accentStrongTextClass}`}>
                          {end.recommendedAmount}
                        </span>
                      </div>
                      <p className="text-[0.875rem] text-slate-700 dark:text-slate-300 leading-relaxed break-words">
                        {end.businessName} &middot; <span className="text-slate-500 dark:text-slate-400">{end.district}</span>
                      </p>
                      <p className="text-xs font-mono text-slate-500 dark:text-slate-400 pt-0.5 break-words">
                        Rujukan: {end.endorsementCode} &middot; Tarikh: {end.issuedAt}
                      </p>
                    </div>

                    <div className="shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEndorsementForView(end);
                          handleSubTabChange('endorsements');
                        }}
                        className={`px-3.5 py-2 rounded-xl text-[0.8125rem] font-semibold shadow-2xs ${mentorTheme.secondaryButtonClass}`}
                      >
                        Lihat
                      </button>
                    </div>
                  </div>
                ))}

                {mentorEndorsements.length === 0 && (
                  <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    Belum ada rekod sokongan dikeluarkan.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Senarai Usahawan Dalam Bimbingan (Reference Table) */}
          <div className="space-y-3">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F1F6FA] tracking-tight">
                Senarai Usahawan Dalam Bimbingan
              </h3>
            </div>

            <div className={`rounded-2xl border backdrop-blur-xs overflow-visible ${mentorTheme.surfaceClass}`}>
              <ReferenceTableToolbar
                searchValue={overviewSearch}
                onSearchChange={setOverviewSearch}
                searchPlaceholder="Cari usahawan, topik atau daerah..."
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
                      <label className="block text-[0.8125rem] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Status Bimbingan
                      </label>
                      <select
                        value={overviewStatusFilter}
                        onChange={(e) => setOverviewStatusFilter(e.target.value as 'all' | 'pending' | 'confirmed' | 'completed')}
                        className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-[#0E151C] border border-slate-200 dark:border-[#213345] text-slate-900 dark:text-[#F1F6FA] cursor-pointer"
                      >
                        <option value="all">Semua Status</option>
                        <option value="pending">Menunggu Pengesahan</option>
                        <option value="confirmed">Disahkan</option>
                        <option value="completed">Selesai</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[0.8125rem] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Daerah
                      </label>
                      <select
                        value={overviewDistrictFilter}
                        onChange={(e) => setOverviewDistrictFilter(e.target.value as 'all' | KelantanDistrict)}
                        className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-[#0E151C] border border-slate-200 dark:border-[#213345] text-slate-900 dark:text-[#F1F6FA] cursor-pointer"
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
                <div className="py-10 text-center text-[0.9375rem] text-slate-500 dark:text-slate-400">
                  Tiada rekod usahawan dalam bimbingan dijumpai.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`${mentorTheme.surfaceMutedClass} border-b ${mentorTheme.dividerClass}`}>
                        <th className="py-3 px-4 text-[0.8125rem] font-semibold text-slate-600 dark:text-slate-400">
                          <button
                            type="button"
                            onClick={() => {
                              setOverviewSortPreset('table_column');
                              if (overviewSortBy === 'name') setOverviewSortDir(p => p === 'asc' ? 'desc' : 'asc');
                              else { setOverviewSortBy('name'); setOverviewSortDir('asc'); }
                            }}
                            className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                          >
                            <span>Usahawan &amp; Perniagaan</span>
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="py-3 px-4 text-[0.8125rem] font-semibold text-slate-600 dark:text-slate-400">
                          <button
                            type="button"
                            onClick={() => {
                              setOverviewSortPreset('table_column');
                              if (overviewSortBy === 'district') setOverviewSortDir(p => p === 'asc' ? 'desc' : 'asc');
                              else { setOverviewSortBy('district'); setOverviewSortDir('asc'); }
                            }}
                            className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                          >
                            <span>Lokasi &amp; Topik</span>
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="py-3 px-4 text-[0.8125rem] font-semibold text-slate-600 dark:text-slate-400">
                          Sokongan
                        </th>
                        <th className="py-3 px-4 text-[0.8125rem] font-semibold text-slate-600 dark:text-slate-400">
                          <button
                            type="button"
                            onClick={() => {
                              setOverviewSortPreset('table_column');
                              if (overviewSortBy === 'status') setOverviewSortDir(p => p === 'asc' ? 'desc' : 'asc');
                              else { setOverviewSortBy('status'); setOverviewSortDir('asc'); }
                            }}
                            className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                          >
                            <span>Keadaan</span>
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="py-3 px-4 w-14 text-right text-[0.8125rem] font-semibold text-slate-600 dark:text-slate-400">
                          <span className="sr-only">Tindakan</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${mentorTheme.dividerClass} text-sm`}>
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
                                <div className={`w-12 h-12 rounded-xl overflow-hidden border bg-slate-100 dark:bg-slate-800 shrink-0 ${mentorTheme.dividerClass}`}>
                                  <PortalImage
                                    src={visuals.businessUrl}
                                    alt={mentee.businessName}
                                    fallbackType="business"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold text-slate-900 dark:text-[#F1F6FA] truncate">{mentee.entrepreneurName}</div>
                                  <div className="text-[0.8125rem] text-slate-500 dark:text-slate-400 truncate">{mentee.businessName}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 max-w-xs">
                              <div className="text-slate-800 dark:text-slate-200 font-medium truncate">{mentee.district}</div>
                              <div className="text-[0.8125rem] text-slate-500 dark:text-slate-400 truncate">{mentee.topic}</div>
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className={`text-[0.8125rem] font-semibold ${
                                hasEndorsement
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-slate-500 dark:text-slate-400'
                              }`}>
                                {hasEndorsement ? 'Sokongan Disahkan' : 'Belum Disyor'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className={`text-[0.8125rem] font-semibold ${
                                mentee.status === 'confirmed'
                                  ? mentorTheme.accentStrongTextClass
                                  : mentee.status === 'completed'
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-amber-600 dark:text-amber-400'
                              }`}>
                                {mentee.status === 'confirmed' ? 'Disahkan' : mentee.status === 'completed' ? 'Selesai' : 'Menunggu'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <RowActionMenu
                                ariaLabel={`Tindakan untuk ${mentee.entrepreneurName}`}
                                items={[
                                  {
                                    label: 'Buka Sesi',
                                    onClick: () => handleSubTabChange('sessions'),
                                    tone: 'accent'
                                  },
                                  {
                                    label: mentee.mentorActionPlan ? 'Kemaskini Nota' : 'Tambah Nota',
                                    onClick: () => handleOpenNotesModal(mentee)
                                  },
                                  {
                                    label: 'Syor Sokongan',
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
          <section id="mentor-applications-section" className="space-y-3 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Users className={`w-5 h-5 shrink-0 ${mentorTheme.accentTextClass}`} />
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F1F6FA] tracking-tight">
                  Senarai Permohonan Sesi
                </h3>
              </div>

              <span className={`text-[0.8125rem] font-mono font-semibold tabular-nums ${mentorTheme.accentTextClass}`}>
                {filteredRegistrations.length} {statusFilter === 'completed' ? 'Selesai' : 'Rekod'}
              </span>
            </div>

            <div className={`rounded-2xl border backdrop-blur-xs overflow-visible ${mentorTheme.surfaceClass}`}>
              <ReferenceTableToolbar
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Cari usahawan, topik atau daerah..."
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
                      <label className="block text-[0.8125rem] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Status Permohonan
                      </label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled')}
                        className={`w-full px-3 py-2 rounded-xl text-sm cursor-pointer ${mentorTheme.inputClass}`}
                      >
                        <option value="all">Aktif ({activeCount})</option>
                        <option value="pending">Menunggu ({pendingCount})</option>
                        <option value="confirmed">Disahkan ({confirmedCount})</option>
                        <option value="completed">Selesai ({completedCount})</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[0.8125rem] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Mod Sesi
                      </label>
                      <select
                        value={modeFilter}
                        onChange={(e) => setModeFilter(e.target.value as 'all' | 'Bersemuka di Kampus' | 'Google Meet')}
                        className={`w-full px-3 py-2 rounded-xl text-sm cursor-pointer ${mentorTheme.inputClass}`}
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
                  <GraduationCap className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-900 dark:text-[#F1F6FA]">
                    {statusFilter === 'completed'
                      ? 'Tiada rekod bimbingan yang telah selesai buat masa ini.'
                      : 'Tiada permohonan bimbingan ditemui.'}
                  </p>
                  <p className="text-[0.9375rem] text-slate-600 dark:text-slate-300 mt-1">
                    {statusFilter !== 'completed' && completedCount > 0
                      ? 'Permohonan yang telah selesai dibimbing boleh dilihat dengan menukar pilihan di Penapis.'
                      : 'Cuba tukar kata kunci carian atau tetapkan semula penapis.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`${mentorTheme.surfaceMutedClass} border-b ${mentorTheme.dividerClass}`}>
                        <th className="py-3 px-4 text-[0.8125rem] font-semibold text-slate-600 dark:text-slate-400">
                          <button
                            type="button"
                            onClick={() => {
                              setApplicationsSortPreset('table_column');
                              if (applicationsSortBy === 'name') setApplicationsSortDir(p => p === 'asc' ? 'desc' : 'asc');
                              else { setApplicationsSortBy('name'); setApplicationsSortDir('asc'); }
                            }}
                            className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                          >
                            <span>Usahawan &amp; Perniagaan</span>
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="py-3 px-4 text-[0.8125rem] font-semibold text-slate-600 dark:text-slate-400">
                          <button
                            type="button"
                            onClick={() => {
                              setApplicationsSortPreset('table_column');
                              if (applicationsSortBy === 'date') setApplicationsSortDir(p => p === 'asc' ? 'desc' : 'asc');
                              else { setApplicationsSortBy('date'); setApplicationsSortDir('asc'); }
                            }}
                            className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                          >
                            <span>Topik &amp; Tarikh</span>
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="py-3 px-4 text-[0.8125rem] font-semibold text-slate-600 dark:text-slate-400">
                          Daerah
                        </th>
                        <th className="py-3 px-4 text-[0.8125rem] font-semibold text-slate-600 dark:text-slate-400">
                          <button
                            type="button"
                            onClick={() => {
                              setApplicationsSortPreset('table_column');
                              if (applicationsSortBy === 'status') setApplicationsSortDir(p => p === 'asc' ? 'desc' : 'asc');
                              else { setApplicationsSortBy('status'); setApplicationsSortDir('asc'); }
                            }}
                            className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                          >
                            <span>Status</span>
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="py-3 px-4 w-14 text-right text-[0.8125rem] font-semibold text-slate-600 dark:text-slate-400">
                          <span className="sr-only">Tindakan</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${mentorTheme.dividerClass} text-sm`}>
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
                              className={`kbelia-table-row cursor-pointer ${mentorTheme.rowHoverClass}`}
                            >
                              <td className="py-3.5 px-4 max-w-xs">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={`w-12 h-12 rounded-xl overflow-hidden border bg-slate-100 dark:bg-slate-800 shrink-0 ${mentorTheme.dividerClass}`}>
                                    <PortalImage
                                      src={visuals.businessUrl}
                                      alt={mentee.businessName}
                                      fallbackType="business"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-semibold text-slate-900 dark:text-[#F1F6FA] truncate">{mentee.entrepreneurName}</div>
                                    <div className="text-[0.8125rem] text-slate-500 dark:text-slate-400 truncate">{mentee.businessName}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 max-w-xs">
                                <div className="font-medium text-slate-900 dark:text-[#F1F6FA] truncate">{mentee.topic}</div>
                                <div className="text-[0.8125rem] text-slate-500 dark:text-slate-400 tabular-nums truncate">
                                  {mentee.preferredDate ? `${mentee.preferredDate} · ${mentee.preferredTime || '10:00 AM'}` : mentee.businessCategory || 'Perniagaan Belia'}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                {mentee.district || 'Kelantan'}
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <span
                                  className={`text-[0.8125rem] font-semibold whitespace-nowrap ${
                                    isCompleted
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : isConfirmed
                                      ? mentorTheme.accentStrongTextClass
                                      : isPending
                                      ? 'text-amber-600 dark:text-amber-400'
                                      : 'text-rose-600 dark:text-rose-400'
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
                                      label: isExpanded ? 'Tutup' : 'Lihat Butiran',
                                      onClick: () =>
                                        setExpandedApplicationIds(prev => ({ ...prev, [mentee.id]: !prev[mentee.id] }))
                                    },
                                    ...(isPending
                                      ? [{
                                          label: 'Sahkan Sesi',
                                          onClick: () => handleStatusChange(mentee, 'confirmed'),
                                          tone: 'accent' as const
                                        }]
                                      : []),
                                    ...(isConfirmed
                                      ? [{
                                          label: 'Selesai',
                                          onClick: () => handleStatusChange(mentee, 'completed'),
                                          tone: 'accent' as const
                                        }]
                                      : []),
                                    {
                                      label: mentee.mentorActionPlan ? 'Kemaskini Nota' : 'Tambah Nota',
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
                              <tr className={mentorTheme.surfaceMutedClass}>
                                <td colSpan={5} className="px-4 sm:px-5 py-4 space-y-3">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                      <MessageSquare className={`w-3.5 h-3.5 ${mentorTheme.accentTextClass}`} />
                                      <span>Mesej Permohonan &amp; Cabaran Usahawan</span>
                                    </div>
                                    <p className="text-[0.9375rem] leading-relaxed text-slate-900 dark:text-[#F1F6FA] whitespace-pre-line">
                                      {mentee.challenges ? (
                                        `"${mentee.challenges}"`
                                      ) : (
                                        <span className="italic text-slate-600 dark:text-slate-300">
                                          "Usahawan memohon sesi bimbingan khusus bagi strategi pemasaran, pengurusan kos operasi, dan persediaan dokumentasi permohonan geran belia."
                                        </span>
                                      )}
                                    </p>
                                  </div>

                                  {mentee.mentorActionPlan && (
                                    <div className={`pt-3 border-t space-y-1 ${mentorTheme.dividerClass}`}>
                                      <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                                        <span className={`flex items-center gap-1.5 ${mentorTheme.accentTextClass}`}>
                                          <FileText className="w-3.5 h-3.5" />
                                          <span>Nota Bimbingan Mentor Tersimpan</span>
                                        </span>
                                        <span className="font-normal opacity-75">Telah dihantar</span>
                                      </div>
                                      <p className="text-[0.9375rem] text-slate-900 dark:text-[#F1F6FA] whitespace-pre-line leading-relaxed">
                                        {mentee.mentorActionPlan}
                                      </p>
                                    </div>
                                  )}

                                  <div className={`flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t ${mentorTheme.dividerClass}`}>
                                    <a
                                      href={cleanPhone ? `https://wa.me/${cleanPhone}?text=Salam%20${encodeURIComponent(mentee.entrepreneurName)}%2C%20saya%20mentor%20anda%20dari%20Hab%20Usahawan%20KBelia.` : '#'}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${mentorTheme.secondaryButtonClass}`}
                                    >
                                      <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                      <span>WhatsApp Usahawan</span>
                                    </a>

                                    <div className="flex flex-wrap items-center gap-2">
                                      {isPending && (
                                        <button
                                          type="button"
                                          onClick={() => handleStatusChange(mentee, 'confirmed')}
                                          className={`px-3.5 py-1.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs ${mentorTheme.primaryButtonClass}`}
                                        >
                                          <Calendar className="w-3.5 h-3.5" />
                                          <span>Sahkan Sesi</span>
                                        </button>
                                      )}

                                      {isConfirmed && (
                                        <button
                                          type="button"
                                          onClick={() => handleStatusChange(mentee, 'completed')}
                                          className={`px-3.5 py-1.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs ${mentorTheme.primaryButtonClass}`}
                                        >
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                          <span>Selesai</span>
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => handleOpenNotesModal(mentee)}
                                        className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${mentorTheme.secondaryButtonClass}`}
                                      >
                                        <FileText className="w-3.5 h-3.5" />
                                        <span>{mentee.mentorActionPlan ? 'Kemaskini Nota' : 'Tambah Nota'}</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setNewEndorsementMenteeName(mentee.entrepreneurName);
                                          setNewEndorsementBusinessName(mentee.businessName);
                                          setNewEndorsementDistrict(mentee.district);
                                          setIsNewEndorsementModalOpen(true);
                                        }}
                                        className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${mentorTheme.secondaryButtonClass}`}
                                      >
                                        <Award className={`w-3.5 h-3.5 ${mentorTheme.accentStrongTextClass}`} />
                                        <span>Sokongan Geran</span>
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
                />
              )}
            </div>
          </section>

          {/* =================================================================== */}
          {/* SEKSYEN 2: JADUAL (REFERENCE TABLE + EXPANDABLE DRAWER)             */}
          {/* =================================================================== */}
          <section id="mentor-schedule-section" className="space-y-3 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Calendar className={`w-5 h-5 shrink-0 ${mentorTheme.accentTextClass}`} />
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F1F6FA] tracking-tight">
                  Jadual Sesi Terdekat
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsNewSlotModalOpen(true)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold shadow-2xs transition-colors cursor-pointer self-start sm:self-auto ${mentorTheme.primaryButtonClass}`}
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Slot</span>
              </button>
            </div>

            <div className={`rounded-2xl border backdrop-blur-xs overflow-visible ${mentorTheme.surfaceClass}`}>
              <ReferenceTableToolbar
                searchValue={scheduleSearch}
                onSearchChange={setScheduleSearch}
                searchPlaceholder="Cari usahawan, topik atau tarikh..."
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
                    <label className="block text-[0.8125rem] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Mod Temujanji
                    </label>
                    <select
                      value={scheduleModeFilter}
                      onChange={(e) => setScheduleModeFilter(e.target.value as 'all' | 'Bersemuka di Kampus' | 'Google Meet')}
                      className={`w-full px-3 py-2 rounded-xl text-sm cursor-pointer ${mentorTheme.inputClass}`}
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
                  <Clock className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-900 dark:text-[#F1F6FA]">Tiada sesi bimbingan aktif ditetapkan dalam jadual.</p>
                  <p className="text-[0.9375rem] text-slate-600 dark:text-slate-300 mt-1">Sahkan permohonan bimbingan di bahagian atas untuk menjadualkan tarikh dan slot.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`${mentorTheme.surfaceMutedClass} border-b ${mentorTheme.dividerClass}`}>
                        <th className="py-3 px-4 text-[0.8125rem] font-semibold text-slate-600 dark:text-slate-400">
                          <button
                            type="button"
                            onClick={() => {
                              setScheduleSortPreset('table_column');
                              if (scheduleSortBy === 'name') setScheduleSortDir(p => p === 'asc' ? 'desc' : 'asc');
                              else { setScheduleSortBy('name'); setScheduleSortDir('asc'); }
                            }}
                            className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                          >
                            <span>Usahawan &amp; Perniagaan</span>
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="py-3 px-4 text-[0.8125rem] font-semibold text-slate-600 dark:text-slate-400">
                          <button
                            type="button"
                            onClick={() => {
                              setScheduleSortPreset('table_column');
                              if (scheduleSortBy === 'date') setScheduleSortDir(p => p === 'asc' ? 'desc' : 'asc');
                              else { setScheduleSortBy('date'); setScheduleSortDir('asc'); }
                            }}
                            className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                          >
                            <span>Tarikh &amp; Masa</span>
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="py-3 px-4 text-[0.8125rem] font-semibold text-slate-600 dark:text-slate-400">
                          Mod &amp; Lokasi
                        </th>
                        <th className="py-3 px-4 text-[0.8125rem] font-semibold text-slate-600 dark:text-slate-400">
                          Daerah
                        </th>
                        <th className="py-3 px-4 w-14 text-right text-[0.8125rem] font-semibold text-slate-600 dark:text-slate-400">
                          <span className="sr-only">Tindakan</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${mentorTheme.dividerClass} text-sm`}>
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
                              className={`kbelia-table-row cursor-pointer ${mentorTheme.rowHoverClass}`}
                            >
                              <td className="py-3.5 px-4 max-w-xs">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={`w-12 h-12 rounded-xl overflow-hidden border bg-slate-100 dark:bg-slate-800 shrink-0 ${mentorTheme.dividerClass}`}>
                                    <PortalImage
                                      src={visuals.businessUrl}
                                      alt={mentee.businessName}
                                      fallbackType="business"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-semibold text-slate-900 dark:text-[#F1F6FA] truncate">{mentee.entrepreneurName}</div>
                                    <div className="text-[0.8125rem] text-slate-500 dark:text-slate-400 truncate">{mentee.businessName}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap tabular-nums">
                                <div className="font-semibold text-slate-900 dark:text-[#F1F6FA]">{mentee.preferredDate || 'Akan Ditetapkan'}</div>
                                <div className="text-[0.8125rem] text-slate-500 dark:text-slate-400">{mentee.preferredTime || '10:00 AM'}</div>
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <span className={`text-[0.8125rem] font-semibold ${mentorTheme.accentStrongTextClass}`}>
                                  {mentee.meetingLink || normalizeMentorshipMode(mentee.mode) === 'Google Meet'
                                    ? 'Google Meet'
                                    : 'Bilik Bimbingan Hab Usahawan'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                {mentee.district || 'Kelantan'}
                              </td>
                              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                <RowActionMenu
                                  ariaLabel={`Tindakan jadual untuk ${mentee.entrepreneurName}`}
                                  items={[
                                    {
                                      label: isExpanded ? 'Tutup' : 'Lihat Butiran',
                                      onClick: () =>
                                        setExpandedScheduleIds(prev => ({ ...prev, [mentee.id]: !prev[mentee.id] }))
                                    },
                                    ...(mentee.meetingLink
                                      ? [{
                                          label: 'Salin Pautan',
                                          onClick: () => {
                                            navigator.clipboard?.writeText(mentee.meetingLink || '');
                                            showToast('Pautan Google Meet disalin.');
                                          }
                                        }]
                                      : []),
                                    {
                                      label: 'Nota',
                                      onClick: () => handleOpenNotesModal(mentee)
                                    },
                                    {
                                      label: 'Selesai',
                                      onClick: () => handleStatusChange(mentee, 'completed'),
                                      tone: 'accent'
                                    }
                                  ]}
                                />
                              </td>
                            </tr>

                            {isExpanded && (
                              <tr className={mentorTheme.surfaceMutedClass}>
                                <td colSpan={5} className="px-4 sm:px-5 py-4 space-y-3">
                                  <div className="text-sm text-slate-900 dark:text-[#F1F6FA] space-y-1">
                                    <p>
                                      Topik Perbincangan: <strong className="font-semibold">{mentee.topic}</strong>
                                    </p>
                                    {mentee.challenges && (
                                      <p className="text-slate-600 dark:text-slate-300 italic">
                                        Nota usahawan: &quot;{mentee.challenges}&quot;
                                      </p>
                                    )}
                                  </div>

                                  <div className={`flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t ${mentorTheme.dividerClass}`}>
                                    <div className="flex flex-wrap items-center gap-3">
                                      {mentee.meetingLink && (
                                        <a
                                          href={mentee.meetingLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold ${mentorTheme.primaryButtonClass}`}
                                        >
                                          <Video className="w-3.5 h-3.5" />
                                          <span>Google Meet</span>
                                        </a>
                                      )}
                                      {cleanPhone && (
                                        <a
                                          href={`https://wa.me/${cleanPhone}?text=Salam%20${encodeURIComponent(mentee.entrepreneurName)}%2C%20peringatan%20sesi%20bimbingan%20kita%20pada%20${encodeURIComponent(mentee.preferredDate || 'tarikh dijadualkan')}.`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={`text-sm font-semibold hover:underline flex items-center gap-1 ${mentorTheme.accentTextClass}`}
                                        >
                                          <Phone className="w-3.5 h-3.5" />
                                          <span>WhatsApp</span>
                                        </a>
                                      )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenNotesModal(mentee)}
                                        className={`px-3.5 py-2 rounded-xl text-sm font-semibold ${mentorTheme.secondaryButtonClass}`}
                                      >
                                        Nota
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleStatusChange(mentee, 'completed')}
                                        className={`px-3.5 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-1.5 ${mentorTheme.primaryButtonClass}`}
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Selesai</span>
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
                />
              )}
            </div>
          </section>

          {/* =================================================================== */}
          {/* SEKSYEN 3: NOTA BIMBINGAN USAHAWAN (REFERENCE TABLE + DRAWER)       */}
          {/* =================================================================== */}
          <section id="mentor-action-plans-section" className="space-y-3 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <FileText className={`w-5 h-5 shrink-0 ${mentorTheme.accentTextClass}`} />
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F1F6FA] tracking-tight">
                  Nota &amp; Panduan Bimbingan
                </h3>
              </div>

              <span className={`text-[0.8125rem] font-mono font-semibold tabular-nums ${mentorTheme.accentTextClass}`}>
                {filteredActionPlanMentees.length} Nota Disediakan
              </span>
            </div>

            <div className={`rounded-2xl border backdrop-blur-xs overflow-visible ${mentorTheme.surfaceClass}`}>
              <ReferenceTableToolbar
                searchValue={actionPlansSearch}
                onSearchChange={setActionPlansSearch}
                searchPlaceholder="Cari usahawan, topik atau nota..."
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
                    <label className="block text-[0.8125rem] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Daerah
                    </label>
                    <select
                      value={actionPlansDistrictFilter}
                      onChange={(e) => setActionPlansDistrictFilter(e.target.value as 'all' | KelantanDistrict)}
                      className={`w-full px-3 py-2 rounded-xl text-sm cursor-pointer ${mentorTheme.inputClass}`}
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
                  <MessageSquare className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto" />
                  <p className="text-sm font-bold text-slate-900 dark:text-[#F1F6FA]">Belum ada nota bimbingan ditemui.</p>
                  <p className="text-[0.9375rem] text-slate-600 dark:text-slate-300">Gunakan menu tindakan pada senarai permohonan untuk merekodkan panduan bisnes usahawan.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`${mentorTheme.surfaceMutedClass} border-b ${mentorTheme.dividerClass}`}>
                        <th className="py-3 px-4 text-[0.8125rem] font-semibold text-slate-600 dark:text-slate-400">
                          <button
                            type="button"
                            onClick={() => {
                              setActionPlansSortPreset('table_column');
                              if (actionPlansSortBy === 'name') setActionPlansSortDir(p => p === 'asc' ? 'desc' : 'asc');
                              else { setActionPlansSortBy('name'); setActionPlansSortDir('asc'); }
                            }}
                            className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                          >
                            <span>Usahawan &amp; Perniagaan</span>
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="py-3 px-4 text-[0.8125rem] font-semibold text-slate-600 dark:text-slate-400">
                          <button
                            type="button"
                            onClick={() => {
                              setActionPlansSortPreset('table_column');
                              if (actionPlansSortBy === 'topic') setActionPlansSortDir(p => p === 'asc' ? 'desc' : 'asc');
                              else { setActionPlansSortBy('topic'); setActionPlansSortDir('asc'); }
                            }}
                            className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                          >
                            <span>Topik Bimbingan</span>
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="py-3 px-4 text-[0.8125rem] font-semibold text-slate-600 dark:text-slate-400">
                          Daerah
                        </th>
                        <th className="py-3 px-4 text-[0.8125rem] font-semibold text-slate-600 dark:text-slate-400">
                          Status
                        </th>
                        <th className="py-3 px-4 w-14 text-right text-[0.8125rem] font-semibold text-slate-600 dark:text-slate-400">
                          <span className="sr-only">Tindakan</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${mentorTheme.dividerClass} text-sm`}>
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
                              className={`kbelia-table-row cursor-pointer ${mentorTheme.rowHoverClass}`}
                            >
                              <td className="py-3.5 px-4 max-w-xs">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={`w-12 h-12 rounded-xl overflow-hidden border bg-slate-100 dark:bg-slate-800 shrink-0 ${mentorTheme.dividerClass}`}>
                                    <PortalImage
                                      src={visuals.businessUrl}
                                      alt={mentee.businessName}
                                      fallbackType="business"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-semibold text-slate-900 dark:text-[#F1F6FA] truncate">{mentee.entrepreneurName}</div>
                                    <div className="text-[0.8125rem] text-slate-500 dark:text-slate-400 truncate">{mentee.businessName}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-slate-700 dark:text-slate-200 max-w-xs truncate">
                                {mentee.topic}
                              </td>
                              <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                {mentee.district || 'Kelantan'}
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <span className="text-[0.8125rem] font-semibold text-emerald-600 dark:text-emerald-400">
                                  Tersimpan
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                <RowActionMenu
                                  ariaLabel={`Tindakan nota untuk ${mentee.entrepreneurName}`}
                                  items={[
                                    {
                                      label: isExpanded ? 'Tutup' : 'Lihat Nota',
                                      onClick: () =>
                                        setExpandedActionPlanIds(prev => ({ ...prev, [mentee.id]: !prev[mentee.id] }))
                                    },
                                    {
                                      label: 'Kemaskini Nota',
                                      onClick: () => handleOpenNotesModal(mentee),
                                      tone: 'accent'
                                    }
                                  ]}
                                />
                              </td>
                            </tr>

                            {isExpanded && (
                              <tr className={mentorTheme.surfaceMutedClass}>
                                <td colSpan={5} className="px-4 sm:px-5 py-4 space-y-3">
                                  <div className="space-y-1">
                                    <span className={`text-xs font-semibold block ${mentorTheme.accentTextClass}`}>
                                      Garis Panduan &amp; Sasaran Tindakan Mentor
                                    </span>
                                    <p className="text-[0.9375rem] text-slate-900 dark:text-[#F1F6FA] whitespace-pre-line leading-relaxed font-sans">
                                      {mentee.mentorActionPlan}
                                    </p>
                                  </div>

                                  <div className={`flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-xs text-slate-500 dark:text-slate-400 ${mentorTheme.dividerClass}`}>
                                    <span>Penyeliaan berterusan di bawah inisiatif Hab Usahawan KBelia</span>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenNotesModal(mentee)}
                                      className={`px-3.5 py-2 rounded-xl text-sm font-semibold ${mentorTheme.primaryButtonClass}`}
                                    >
                                      Ubah Nota
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
                />
              )}
            </div>
          </section>

        </div>
      )}

      {/* ===================================================================== */}
      {/* ===================================================================== */}
      {/* TAB 1A: SENARAI MENTEE (RINGKAS & TERUS)                              */}
      {/* ===================================================================== */}
      {currentSubTab === 'mentees' && (() => {
        const filteredMentees = menteeDirectory.filter((m) => {
          if (menteeDistrictFilter !== 'all' && m.district !== menteeDistrictFilter) return false;
          const q = menteeSearch.trim().toLowerCase();
          if (!q) return true;
          return (
            m.menteeName.toLowerCase().includes(q) ||
            m.businessName.toLowerCase().includes(q) ||
            m.district.toLowerCase().includes(q) ||
            m.category.toLowerCase().includes(q)
          );
        });

        return (
          <div key="mentees" className="space-y-4 animate-dashboard-tab">
            <div className={`p-4 sm:p-5 rounded-2xl border backdrop-blur-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${mentorTheme.surfaceClass}`}>
              <div className="flex items-center gap-2.5">
                <Users className={`w-5 h-5 shrink-0 ${mentorTheme.accentTextClass}`} />
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F1F6FA] tracking-tight">
                    {!isEn ? 'Senarai Mentee Bimbingan' : 'Assigned Mentees'} ({filteredMentees.length})
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                    {!isEn
                      ? 'Lihat maklumat usahawan, rekod sesi, dan terus hubungi atau semak geran.'
                      : 'View entrepreneur details, session counts, and take direct action.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={menteeSearch}
                    onChange={(e) => setMenteeSearch(e.target.value)}
                    placeholder={!isEn ? 'Cari nama atau bisnes...' : 'Search name or business...'}
                    className={`pl-9 pr-3 py-2 rounded-xl text-sm w-48 sm:w-56 ${mentorTheme.inputClass}`}
                  />
                </div>
                <select
                  value={menteeDistrictFilter}
                  onChange={(e) => setMenteeDistrictFilter(e.target.value as 'all' | KelantanDistrict)}
                  className={`px-3 py-2 rounded-xl text-sm cursor-pointer ${mentorTheme.inputClass}`}
                >
                  <option value="all">{!isEn ? 'Semua Daerah' : 'All Districts'}</option>
                  {uniqueMentorDistricts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={`rounded-2xl border backdrop-blur-xs overflow-hidden ${mentorTheme.surfaceClass}`}>
              {filteredMentees.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-3">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {!isEn ? 'Tiada mentee sepadan dengan carian anda.' : 'No mentees match your search.'}
                  </p>
                  {(menteeSearch || menteeDistrictFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenteeSearch('');
                        setMenteeDistrictFilter('all');
                      }}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer ${mentorTheme.secondaryButtonClass}`}
                    >
                      {!isEn ? 'Set Semula' : 'Reset'}
                    </button>
                  )}
                </div>
              ) : (
                <div className={`divide-y ${mentorTheme.dividerClass}`}>
                  {filteredMentees.map((m) => {
                    const cleanPhone = (m.phone || '').replace(/\D/g, '');
                    const savedCheck = grantChecks.find(
                      (c) => c.mentorId === currentMentor.id && c.menteeKey === m.key
                    );
                    const checkScore = savedCheck
                      ? [savedCheck.hasSsm, savedCheck.hasSalesRecord, savedCheck.attendedSession, savedCheck.productReady].filter(Boolean).length
                      : null;

                    return (
                      <div
                        key={m.key}
                        className={`p-4 sm:px-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 transition-colors ${mentorTheme.rowHoverClass}`}
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                            <span className="text-sm sm:text-[0.9375rem] font-bold text-slate-900 dark:text-[#F1F6FA]">
                              {m.menteeName}
                            </span>
                            <span className="text-xs text-slate-400">&middot;</span>
                            <span className={`text-sm font-semibold ${mentorTheme.accentTextClass}`}>
                              {m.businessName}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-[0.8125rem] text-slate-600 dark:text-slate-300">
                            <span>{m.district}</span>
                            <span>&middot;</span>
                            <span>{m.ssmNumber ? `SSM: ${m.ssmNumber}` : 'Tiada SSM'}</span>
                            <span>&middot;</span>
                            <span className="tabular-nums">{m.completedSessions} sesi selesai</span>
                            <span>&middot;</span>
                            <span className="tabular-nums">{m.totalLogs} catatan</span>
                            <span>&middot;</span>
                            {m.hasEndorsement ? (
                              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                                Sokongan Geran Aktif
                              </span>
                            ) : checkScore === 4 ? (
                              <span className="font-semibold text-blue-700 dark:text-cyan-400">
                                Layak Geran (4/4)
                              </span>
                            ) : checkScore !== null ? (
                              <span className="font-semibold text-amber-700 dark:text-amber-400 tabular-nums">
                                Semakan ({checkScore}/4)
                              </span>
                            ) : (
                              <span className="text-slate-500 dark:text-slate-400">
                                Belum Disemak
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {cleanPhone && (
                            <a
                              href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Salam ${m.menteeName}, saya mentor anda dari KBelia.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 ${mentorTheme.secondaryButtonClass}`}
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => openCreateLogForMentee(m.menteeName, m.businessName)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${mentorTheme.secondaryButtonClass}`}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Nota Sesi</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCheckMenteeKey(m.key);
                              handleSubTabChange('readiness');
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${mentorTheme.primaryButtonClass}`}
                          >
                            <ClipboardCheck className="w-3.5 h-3.5" />
                            <span>Semak Geran</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ===================================================================== */}
      {/* TAB 1B: JADUAL KALENDAR TEMU JANJI & SLOT MENTOR                      */}
      {/* ===================================================================== */}
      {currentSubTab === 'schedule' && (
        <MentorScheduleCalendar
          currentMentor={currentMentor}
          registrations={mentorRegistrations}
          businesses={businesses}
          isEn={isEn}
          onStatusChange={handleStatusChange}
          onOpenNotesModal={handleOpenNotesModal}
          onOpenCreateSlotModal={handleOpenCreateSlotWithPrefill}
          onDeletePublishedSlot={handleDeletePublishedSlot}
        />
      )}

      {/* ===================================================================== */}
      {/* TAB 1C: SEMAK GERAN (4 PERKARA ASAS MUDAH)                            */}
      {/* ===================================================================== */}
      {currentSubTab === 'readiness' && (() => {
        const filteredCheckList = menteeDirectory.filter((m) => {
          const q = readinessSearch.trim().toLowerCase();
          if (!q) return true;
          return (
            m.menteeName.toLowerCase().includes(q) ||
            m.businessName.toLowerCase().includes(q)
          );
        });

        const checklistItems: {
          key: 'hasSsm' | 'hasSalesRecord' | 'attendedSession' | 'productReady';
          title: string;
          hint: string;
        }[] = [
          {
            key: 'hasSsm',
            title: '1. Ada pendaftaran SSM',
            hint: activeCheckMentee?.ssmNumber
              ? `No. SSM direkod: ${activeCheckMentee.ssmNumber}`
              : 'Semak sama ada bisnes sudah berdaftar dengan SSM.'
          },
          {
            key: 'hasSalesRecord',
            title: '2. Ada rekod jualan harian',
            hint: 'Mentee mencatat jualan dan perbelanjaan asas perniagaan.'
          },
          {
            key: 'attendedSession',
            title: '3. Pernah hadir sesi bimbingan',
            hint: activeCheckMentee
              ? `${activeCheckMentee.completedSessions} sesi selesai · ${activeCheckMentee.totalLogs} catatan`
              : 'Mentee hadir sesi bimbingan bersama mentor.'
          },
          {
            key: 'productReady',
            title: '4. Produk atau servis siap dijual',
            hint: 'Produk/servis sudah sedia untuk pelanggan dan pasaran.'
          }
        ];

        const readyCount = [
          draftGrantCheck.hasSsm,
          draftGrantCheck.hasSalesRecord,
          draftGrantCheck.attendedSession,
          draftGrantCheck.productReady
        ].filter(Boolean).length;

        const isFullyReady = readyCount === 4;

        return (
          <div key="readiness" className="space-y-4 animate-dashboard-tab">
            <div className={`p-4 sm:p-5 rounded-2xl border backdrop-blur-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${mentorTheme.surfaceClass}`}>
              <div className="flex items-center gap-2.5">
                <ClipboardCheck className={`w-5 h-5 shrink-0 ${mentorTheme.accentTextClass}`} />
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F1F6FA] tracking-tight">
                    Semak Kelayakan Asas Geran
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                    Pilih mentee dan tanda 4 perkara asas sebelum memberi surat sokongan geran.
                  </p>
                </div>
              </div>
            </div>

            {menteeDirectory.length === 0 ? (
              <div className={`rounded-2xl border p-8 text-center space-y-3 ${mentorTheme.surfaceClass}`}>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Belum ada rekod mentee untuk disemak.
                </p>
                <button
                  type="button"
                  onClick={() => handleSubTabChange('sessions')}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer ${mentorTheme.primaryButtonClass}`}
                >
                  Lihat Sesi
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* Senarai Mentee Kiri */}
                <div className={`lg:col-span-4 rounded-2xl border overflow-hidden ${mentorTheme.surfaceClass}`}>
                  <div className={`p-3 border-b ${mentorTheme.dividerClass}`}>
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={readinessSearch}
                        onChange={(e) => setReadinessSearch(e.target.value)}
                        placeholder="Pilih mentee..."
                        className={`w-full pl-9 pr-3 py-2 rounded-xl text-sm ${mentorTheme.inputClass}`}
                      />
                    </div>
                  </div>
                  <div className={`divide-y max-h-[420px] overflow-y-auto ${mentorTheme.dividerClass}`}>
                    {filteredCheckList.map((m) => {
                      const isSelected = activeCheckMentee?.key === m.key;
                      const saved = grantChecks.find(
                        (c) => c.mentorId === currentMentor.id && c.menteeKey === m.key
                      );
                      const score = saved
                        ? [saved.hasSsm, saved.hasSalesRecord, saved.attendedSession, saved.productReady].filter(Boolean).length
                        : null;
                      return (
                        <button
                          key={m.key}
                          type="button"
                          onClick={() => setSelectedCheckMenteeKey(m.key)}
                          className={`w-full text-left px-4 py-3 flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                            isSelected
                              ? `${mentorTheme.surfaceMutedClass} font-semibold`
                              : mentorTheme.rowHoverClass
                          }`}
                        >
                          <div className="min-w-0">
                            <p className={`text-sm font-semibold truncate ${isSelected ? mentorTheme.accentTextClass : 'text-slate-900 dark:text-[#F1F6FA]'}`}>
                              {m.menteeName}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {m.businessName}
                            </p>
                          </div>
                          <span className={`text-xs font-semibold shrink-0 tabular-nums ${
                            m.hasEndorsement
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : score === 4
                              ? 'text-blue-700 dark:text-cyan-400'
                              : score !== null
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-slate-400'
                          }`}>
                            {m.hasEndorsement ? 'Disokong' : score !== null ? `${score}/4` : 'Baru'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Borang 4 Tandaan Kanan */}
                {activeCheckMentee && (
                  <div className={`lg:col-span-8 rounded-2xl border overflow-hidden ${mentorTheme.surfaceClass}`}>
                    <div className={`p-4 sm:p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${mentorTheme.surfaceMutedClass} ${mentorTheme.dividerClass}`}>
                      <div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-[#F1F6FA]">
                          {activeCheckMentee.menteeName}
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                          {activeCheckMentee.businessName} &middot; {activeCheckMentee.district}
                        </p>
                      </div>
                      <span className={`text-sm font-bold tabular-nums ${
                        isFullyReady
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-amber-700 dark:text-amber-400'
                      }`}>
                        {readyCount} / 4 &middot; {isFullyReady ? 'Layak' : 'Belum Lengkap'}
                      </span>
                    </div>

                    <div className={`divide-y ${mentorTheme.dividerClass}`}>
                      {checklistItems.map((item) => {
                        const checked = draftGrantCheck[item.key];
                        return (
                          <div
                            key={item.key}
                            className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900 dark:text-[#F1F6FA]">
                                {item.title}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {item.hint}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  setDraftGrantCheck((prev) => ({ ...prev, [item.key]: true }))
                                }
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                                  checked
                                    ? mentorTheme.primaryButtonClass
                                    : mentorTheme.secondaryButtonClass
                                }`}
                              >
                                Ya
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDraftGrantCheck((prev) => ({ ...prev, [item.key]: false }))
                                }
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                                  !checked
                                    ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                                    : mentorTheme.secondaryButtonClass
                                }`}
                              >
                                Belum
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className={`p-4 sm:p-5 border-t space-y-4 ${mentorTheme.dividerClass}`}>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                          Catatan Ringkas (Pilihan)
                        </label>
                        <input
                          type="text"
                          value={draftGrantCheck.notes}
                          onChange={(e) =>
                            setDraftGrantCheck((prev) => ({ ...prev, notes: e.target.value }))
                          }
                          placeholder="Contoh: Dokumen SSM lengkap, sedia mohon geran RM3,000."
                          className={`w-full px-3.5 py-2 rounded-xl text-sm ${mentorTheme.inputClass}`}
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => saveMenteeGrantCheck(false)}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer ${mentorTheme.secondaryButtonClass}`}
                        >
                          Simpan Semakan
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            saveMenteeGrantCheck(true);
                            const summaryText = `Semakan Mentor (${readyCount}/4): ${
                              draftGrantCheck.hasSsm ? 'Ada SSM' : 'SSM belum lengkap'
                            }, ${
                              draftGrantCheck.hasSalesRecord ? 'ada rekod jualan' : 'rekod jualan belum lengkap'
                            }, ${
                              draftGrantCheck.attendedSession ? 'hadir sesi bimbingan' : 'belum hadir sesi'
                            }, ${
                              draftGrantCheck.productReady ? 'produk siap dijual' : 'produk dalam penyediaan'
                            }.${draftGrantCheck.notes ? ` Catatan: ${draftGrantCheck.notes}` : ''}`;

                            setNewEndorsementMenteeName(activeCheckMentee.menteeName);
                            setNewEndorsementBusinessName(activeCheckMentee.businessName);
                            setNewEndorsementCategory(activeCheckMentee.category || 'Makanan & Minuman (F&B)');
                            setNewEndorsementDistrict(activeCheckMentee.district || 'Kota Bharu');
                            setNewEndorsementReadiness(summaryText);
                            handleSubTabChange('endorsements');
                            setIsNewEndorsementModalOpen(true);
                          }}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer ${mentorTheme.primaryButtonClass}`}
                        >
                          <Award className="w-4 h-4" />
                          <span>Beri Sokongan</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* ===================================================================== */}
      {/* TAB 2: SOKONGAN RASMI USAHAWAN BELIA                                  */}
      {/* ===================================================================== */}
      {currentSubTab === 'endorsements' && (
        <div key="endorsements" className="space-y-4 animate-dashboard-tab">
          
          <div className={`p-4 sm:p-5 rounded-2xl border backdrop-blur-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${mentorTheme.surfaceClass}`}>
            <div className="flex items-center gap-2.5">
              <Award className={`w-5 h-5 shrink-0 ${mentorTheme.accentTextClass}`} />
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F1F6FA] tracking-tight">
                  Sokongan &amp; Perakuan Usahawan
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                  Sediakan surat sokongan rasmi bagi usahawan seliaan yang bersedia ke fasa seterusnya.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsNewEndorsementModalOpen(true)}
              className={`interactive-press px-4 py-2.5 font-semibold text-sm rounded-xl shadow-2xs inline-flex items-center justify-center gap-2 shrink-0 ${mentorTheme.primaryButtonClass}`}
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Perakuan</span>
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileCheck className={`w-4.5 h-4.5 shrink-0 ${mentorTheme.accentTextClass}`} />
              <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F1F6FA] tracking-tight">
                Senarai Perakuan Dikeluarkan ({filteredEndorsements.length})
              </h4>
            </div>

            <div className={`rounded-2xl border backdrop-blur-xs overflow-visible ${mentorTheme.surfaceClass}`}>
              <ReferenceTableToolbar
                searchValue={endorsementsSearch}
                onSearchChange={setEndorsementsSearch}
                searchPlaceholder="Cari usahawan, kod atau daerah..."
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
                    <label className="block text-[0.8125rem] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Tahap Sokongan Disyorkan
                    </label>
                    <select
                      value={endorsementsGrantFilter}
                      onChange={(e) => setEndorsementsGrantFilter(e.target.value as 'all' | 'RM3,000' | 'RM5,000' | 'RM10,000')}
                      className={`w-full px-3 py-2 rounded-xl text-sm cursor-pointer ${mentorTheme.inputClass}`}
                    >
                      <option value="all">Semua Peringkat</option>
                      <option value="RM3,000">RM3,000 (Permulaan)</option>
                      <option value="RM5,000">RM5,000 (Pemangkin)</option>
                      <option value="RM10,000">RM10,000 (Skala Besar)</option>
                    </select>
                  </div>
                }
              />

              {filteredEndorsements.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                  Tiada surat perakuan dikeluarkan di bawah seliaan anda bagi carian ini.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`${mentorTheme.surfaceMutedClass} border-b ${mentorTheme.dividerClass}`}>
                        <th className="py-3 px-4 text-[0.8125rem] font-semibold text-slate-600 dark:text-slate-400">
                          <button
                            type="button"
                            onClick={() => {
                              setEndorsementsSortPreset('table_column');
                              if (endorsementsSortBy === 'name') setEndorsementsSortDir(p => p === 'asc' ? 'desc' : 'asc');
                              else { setEndorsementsSortBy('name'); setEndorsementsSortDir('asc'); }
                            }}
                            className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                          >
                            <span>Usahawan &amp; Kod Rujukan</span>
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="py-3 px-4 text-[0.8125rem] font-semibold text-slate-600 dark:text-slate-400">
                          Program &amp; Nilai Disyor
                        </th>
                        <th className="py-3 px-4 text-[0.8125rem] font-semibold text-slate-600 dark:text-slate-400">
                          Daerah
                        </th>
                        <th className="py-3 px-4 text-[0.8125rem] font-semibold text-slate-600 dark:text-slate-400">
                          <button
                            type="button"
                            onClick={() => {
                              setEndorsementsSortPreset('table_column');
                              if (endorsementsSortBy === 'date') setEndorsementsSortDir(p => p === 'asc' ? 'desc' : 'asc');
                              else { setEndorsementsSortBy('date'); setEndorsementsSortDir('desc'); }
                            }}
                            className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                          >
                            <span>Tarikh</span>
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="py-3 px-4 text-[0.8125rem] font-semibold text-slate-600 dark:text-slate-400">
                          Status
                        </th>
                        <th className="py-3 px-4 w-14 text-right text-[0.8125rem] font-semibold text-slate-600 dark:text-slate-400">
                          <span className="sr-only">Tindakan</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${mentorTheme.dividerClass} text-sm`}>
                      {endorsementsPagination.paginatedItems.map((item) => (
                        <tr key={item.id} className={`kbelia-table-row ${mentorTheme.rowHoverClass}`}>
                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${mentorTheme.surfaceMutedClass} ${mentorTheme.dividerClass} ${mentorTheme.accentTextClass}`}>
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-900 dark:text-[#F1F6FA] truncate">{item.menteeName}</div>
                                <div className="text-[0.8125rem] text-slate-500 dark:text-slate-400 font-mono truncate">{item.endorsementCode}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="font-medium text-slate-900 dark:text-[#F1F6FA] truncate">{item.businessName}</div>
                            <div className="text-[0.8125rem] text-slate-500 dark:text-slate-400 truncate">{item.grantProgramTitle} ({item.recommendedAmount})</div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {item.district}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap tabular-nums">
                            {item.issuedAt}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 text-[0.8125rem] font-semibold text-emerald-600 dark:text-emerald-400">
                              <Check className="w-3.5 h-3.5" />
                              <span>Disahkan Rasmi</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <RowActionMenu
                              ariaLabel={`Tindakan surat perakuan ${item.menteeName}`}
                              items={[
                                {
                                  label: 'Lihat Surat',
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
                />
              )}
            </div>
          </div>

        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: CATATAN & PERKONGSIAN SESI                                     */}
      {/* ===================================================================== */}
      {currentSubTab === 'logbook' && (
        <div key="logbook" className="space-y-4 animate-dashboard-tab">
          
          <div className={`p-4 sm:p-5 rounded-2xl border backdrop-blur-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${mentorTheme.surfaceClass}`}>
            <div className="flex items-center gap-2.5">
              <FileText className={`w-5 h-5 shrink-0 ${mentorTheme.accentTextClass}`} />
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F1F6FA] tracking-tight">
                  Catatan Sesi &amp; Tindakan Susulan
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                  Rekodkan ringkasan perbincangan serta tugasan bersama usahawan seliaan anda.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openCreateLogModal}
              className={`interactive-press px-5 py-2.5 font-semibold text-sm rounded-xl shadow-2xs flex items-center justify-center gap-2 shrink-0 cursor-pointer ${mentorTheme.primaryButtonClass}`}
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Rekod</span>
            </button>
          </div>

          <div className={`rounded-2xl border backdrop-blur-xs overflow-visible ${mentorTheme.surfaceClass}`}>
            <ReferenceTableToolbar
              searchValue={logsSearch}
              onSearchChange={setLogsSearch}
              searchPlaceholder="Cari usahawan, topik atau tarikh..."
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
                  <label className="block text-[0.8125rem] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Status Tugasan
                  </label>
                  <select
                    value={logsStatusFilter}
                    onChange={(e) => setLogsStatusFilter(e.target.value as 'all' | 'done' | 'pending')}
                    className={`w-full px-3 py-2 rounded-xl text-sm cursor-pointer ${mentorTheme.inputClass}`}
                  >
                    <option value="all">Semua Rekod Sesi</option>
                    <option value="pending">Tugasan Masih Berjalan</option>
                    <option value="done">Semua Tugasan Selesai</option>
                  </select>
                </div>
              }
            />

            {filteredLogs.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                Belum ada rekod sesi bimbingan untuk usahawan seliaan anda bagi carian ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`${mentorTheme.surfaceMutedClass} border-b ${mentorTheme.dividerClass}`}>
                      <th className="py-3 px-4 text-[0.8125rem] font-semibold text-slate-600 dark:text-slate-400">
                        <button
                          type="button"
                          onClick={() => {
                            setLogsSortPreset('table_column');
                            if (logsSortBy === 'name') setLogsSortDir(p => p === 'asc' ? 'desc' : 'asc');
                            else { setLogsSortBy('name'); setLogsSortDir('asc'); }
                          }}
                          className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                        >
                          <span>Usahawan &amp; Perniagaan</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="py-3 px-4 text-[0.8125rem] font-semibold text-slate-600 dark:text-slate-400">
                        Topik Bimbingan
                      </th>
                      <th className="py-3 px-4 text-[0.8125rem] font-semibold text-slate-600 dark:text-slate-400">
                        <button
                          type="button"
                          onClick={() => {
                            setLogsSortPreset('table_column');
                            if (logsSortBy === 'date') setLogsSortDir(p => p === 'asc' ? 'desc' : 'asc');
                            else { setLogsSortBy('date'); setLogsSortDir('desc'); }
                          }}
                          className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                        >
                          <span>Tarikh Sesi</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="py-3 px-4 text-[0.8125rem] font-semibold text-slate-600 dark:text-slate-400">
                        Kemajuan Tugasan
                      </th>
                      <th className="py-3 px-4 w-14 text-right text-[0.8125rem] font-semibold text-slate-600 dark:text-slate-400">
                        <span className="sr-only">Tindakan</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${mentorTheme.dividerClass} text-sm`}>
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
                            className={`kbelia-table-row cursor-pointer ${mentorTheme.rowHoverClass}`}
                          >
                            <td className="py-3.5 px-4 max-w-xs">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-12 h-12 rounded-xl overflow-hidden border bg-slate-100 dark:bg-slate-800 shrink-0 ${mentorTheme.dividerClass}`}>
                                  <PortalImage
                                    src={visuals.businessUrl}
                                    alt={log.businessName}
                                    fallbackType="business"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold text-slate-900 dark:text-[#F1F6FA] truncate">{log.menteeName}</div>
                                  <div className="text-[0.8125rem] text-slate-500 dark:text-slate-400 truncate">{log.businessName}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-700 dark:text-slate-200 max-w-xs truncate">
                              {log.topic}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap font-mono tabular-nums">
                              {log.sessionDate}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="inline-flex items-center gap-2.5">
                                <span
                                  className={`text-[0.8125rem] font-semibold tabular-nums whitespace-nowrap ${
                                    totalTasks > 0 && doneTasks === totalTasks
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : mentorTheme.accentStrongTextClass
                                  }`}
                                >
                                  {totalTasks > 0 ? `${doneTasks}/${totalTasks} Tugasan` : 'Direkodkan'}
                                </span>
                                {totalTasks > 0 && (
                                  <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden hidden sm:block">
                                    <div
                                      className={`h-full rounded-full transition-[width] duration-500 ${
                                        doneTasks === totalTasks ? 'bg-emerald-500' : mentorTheme.progressFillClass
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
                            <tr className={mentorTheme.surfaceMutedClass}>
                              <td colSpan={5} className="px-4 sm:px-5 py-4 space-y-4">
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <div className={`text-xs font-semibold ${mentorTheme.accentTextClass}`}>
                                      Ringkasan Perbincangan Sesi
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => openEditLogModal(log)}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[0.8125rem] font-semibold ${mentorTheme.secondaryButtonClass}`}
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                        <span>Sunting</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteLogEntry(log)}
                                        className={`px-3 py-1.5 text-[0.8125rem] ${mentorTheme.dangerOutlineButtonClass}`}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Padam</span>
                                      </button>
                                    </div>
                                  </div>
                                  <p className="text-[0.9375rem] text-slate-900 dark:text-[#F1F6FA] leading-relaxed font-sans">
                                    {log.minutes}
                                  </p>
                                </div>

                                <div className={`pt-3 border-t space-y-2.5 ${mentorTheme.dividerClass}`}>
                                  <div className="text-sm font-bold text-slate-900 dark:text-[#F1F6FA] flex items-center justify-between gap-2 flex-wrap">
                                    <span>Senarai Semak Tugasan Susulan</span>
                                    <div className="flex items-center gap-3 flex-wrap">
                                      <span className="text-[0.8125rem] text-slate-500 dark:text-slate-400 font-normal">
                                        Tekan kotak untuk tandakan selesai, atau sunting terus
                                      </span>
                                      {!inlineNewTaskDrafts[log.id]?.isOpen && (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenInlineNewTask(log.id)}
                                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[0.8125rem] font-semibold ${mentorTheme.primaryButtonClass}`}
                                        >
                                          <Plus className="w-3.5 h-3.5" />
                                          <span>Tambah</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {(!log.actionItems || log.actionItems.length === 0) ? (
                                    <div className={`py-3 text-[0.8125rem] text-slate-600 dark:text-slate-300 flex items-center justify-between gap-2 flex-wrap border-t ${mentorTheme.dividerClass}`}>
                                      <span>Belum ada tugasan direkodkan untuk sesi ini.</span>
                                      {!inlineNewTaskDrafts[log.id]?.isOpen && (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenInlineNewTask(log.id)}
                                          className={`font-bold hover:underline cursor-pointer ${mentorTheme.accentTextClass}`}
                                        >
                                          + Tambah tugasan pertama
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    <div className={`divide-y ${mentorTheme.dividerClass}`}>
                                      {log.actionItems.map((task) => {
                                        const isEditingThis =
                                          editingInlineTask?.logId === log.id &&
                                          editingInlineTask?.taskId === task.id;

                                        if (isEditingThis && editingInlineTask) {
                                          return (
                                            <div
                                              key={task.id}
                                              className="py-3 space-y-2.5"
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
                                                  className={`sm:col-span-2 px-3 py-2 rounded-xl text-sm ${mentorTheme.inputClass}`}
                                                />
                                                <ModernDatePicker
                                                  value={editingInlineTask.dueDate}
                                                  onChange={(val) =>
                                                    setEditingInlineTask(prev =>
                                                      prev ? { ...prev, dueDate: val } : prev
                                                    )
                                                  }
                                                  valueFormat="iso"
                                                  accentColor="blue"
                                                  placeholder="Tarikh sasaran"
                                                />
                                              </div>
                                              <div className="flex items-center justify-end gap-2">
                                                <button
                                                  type="button"
                                                  onClick={() => setEditingInlineTask(null)}
                                                  className={`px-3.5 py-1.5 rounded-xl text-[0.8125rem] font-semibold ${mentorTheme.secondaryButtonClass}`}
                                                >
                                                  Batal
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={handleSaveInlineTaskEdit}
                                                  className={`px-3.5 py-1.5 rounded-xl text-[0.8125rem] font-semibold ${mentorTheme.primaryButtonClass}`}
                                                >
                                                  Simpan
                                                </button>
                                              </div>
                                            </div>
                                          );
                                        }

                                        return (
                                          <div
                                            key={task.id}
                                            className={`py-2.5 transition-colors flex flex-wrap items-center justify-between gap-3 ${
                                              task.completed
                                                ? 'text-slate-500 dark:text-slate-400'
                                                : 'text-slate-900 dark:text-[#F1F6FA]'
                                            }`}
                                          >
                                            <button
                                              type="button"
                                              onClick={() => handleToggleLogTask(log.id, task.id)}
                                              className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                                            >
                                              <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                                                task.completed
                                                  ? 'bg-[#1D4ED8] border-[#1D4ED8] dark:bg-[#0EA5E9] dark:border-[#0EA5E9] text-white dark:text-[#07111A]'
                                                  : `border-slate-300 dark:border-slate-600 ${mentorTheme.surfaceClass}`
                                              }`}>
                                                {task.completed && <Check className="w-3.5 h-3.5" />}
                                              </div>
                                              <span className={`text-sm font-medium break-words ${task.completed ? 'line-through' : ''}`}>
                                                {task.task}
                                              </span>
                                            </button>

                                            <div className="flex items-center gap-2 shrink-0">
                                              <span className={`text-[0.8125rem] font-mono tabular-nums ${
                                                task.completed
                                                  ? 'text-emerald-600 dark:text-emerald-400'
                                                  : 'text-slate-500 dark:text-slate-400'
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
                                                className={`p-1.5 rounded-xl text-slate-500 dark:text-slate-400 transition-colors cursor-pointer ${mentorTheme.rowHoverClass}`}
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
                                                className="p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
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
                                    <div className={`pt-3 border-t space-y-2.5 ${mentorTheme.dividerClass}`}>
                                      <div className="text-[0.8125rem] font-bold text-slate-900 dark:text-[#F1F6FA]">
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
                                          placeholder="Masukkan tugasan baharu untuk usahawan"
                                          autoFocus
                                          className={`sm:col-span-2 px-3 py-2 rounded-xl text-sm ${mentorTheme.inputClass}`}
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
                                          accentColor="blue"
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
                                          className={`px-3.5 py-1.5 rounded-xl text-[0.8125rem] font-semibold ${mentorTheme.secondaryButtonClass}`}
                                        >
                                          Batal
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleSaveInlineNewTask(log.id)}
                                          className={`px-3.5 py-1.5 rounded-xl text-[0.8125rem] font-semibold ${mentorTheme.primaryButtonClass}`}
                                        >
                                          Tambah
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
              />
            )}
          </div>

        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3B: LAPORAN RINGKAS MENTOR                                        */}
      {/* ===================================================================== */}
      {currentSubTab === 'impact' && (() => {
        const completedCount = mentorRegistrations.filter((r) => r.status === 'completed').length;
        const activeEndorsementCount = mentorEndorsements.filter((e) => e.status === 'active').length;

        const districtMap = new Map<string, { district: string; mentees: number; sessions: number; endorsements: number }>();
        for (const m of menteeDirectory) {
          const d = m.district || 'Kota Bharu';
          const row = districtMap.get(d) || { district: d, mentees: 0, sessions: 0, endorsements: 0 };
          row.mentees += 1;
          row.sessions += m.completedSessions;
          if (m.hasEndorsement) row.endorsements += 1;
          districtMap.set(d, row);
        }
        const districtRows = Array.from(districtMap.values()).sort((a, b) => b.mentees - a.mentees);

        const sectorMap = new Map<string, number>();
        for (const m of menteeDirectory) {
          const sec = m.category || 'Umum';
          sectorMap.set(sec, (sectorMap.get(sec) || 0) + 1);
        }
        const sectorRows = Array.from(sectorMap.entries())
          .map(([sector, count]) => ({ sector, count }))
          .sort((a, b) => b.count - a.count);

        const buildSummaryReportHtml = () => {
          const todayLabel = new Date().toLocaleDateString('ms-MY', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          });
          return generateMentorSummaryReportHtml({
            mentorName: currentMentor.name,
            mentorAgency: currentMentor.agency,
            mentorDesignation: currentMentor.title,
            totalMentees: menteeDirectory.length,
            completedSessions: completedCount,
            totalLogs: mentorLogs.length,
            totalEndorsements: activeEndorsementCount,
            districtRows,
            sectorRows,
            generatedDate: todayLabel,
            refCode: `LAP-${currentMentor.id.toUpperCase()}-${new Date().getFullYear()}`
          });
        };

        return (
          <div key="impact" className="space-y-4 animate-dashboard-tab">
            <div className={`p-4 sm:p-5 rounded-2xl border backdrop-blur-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${mentorTheme.surfaceClass}`}>
              <div className="flex items-center gap-2.5">
                <BarChart3 className={`w-5 h-5 shrink-0 ${mentorTheme.accentTextClass}`} />
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F1F6FA] tracking-tight">
                    Laporan Ringkas Bimbingan
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                    Ringkasan jumlah mentee, sesi selesai, pecahan daerah dan muat turun laporan.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openAndPrintDocument(buildSummaryReportHtml(), 'Laporan Ringkas Mentor KBelia')}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer ${mentorTheme.secondaryButtonClass}`}
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Laporan</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await downloadHtmlAsPdf(
                        buildSummaryReportHtml(),
                        `Laporan_Mentor_${currentMentor.name.replace(/\s+/g, '_')}`
                      );
                      triggerToast('Laporan PDF berjaya dimuat turun.', 'success');
                    } catch {
                      triggerToast('Gagal menjana PDF laporan.', 'error');
                    }
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer ${mentorTheme.primaryButtonClass}`}
                >
                  <Download className="w-4 h-4" />
                  <span>Muat Turun PDF</span>
                </button>
              </div>
            </div>

            {/* 4 Angka Ringkas */}
            <div className={`grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x rounded-2xl border ${mentorTheme.surfaceClass} ${mentorTheme.dividerClass}`}>
              <div className="p-4 sm:p-5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Jumlah Mentee</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-[#F1F6FA] mt-1 tabular-nums">
                  {menteeDirectory.length}
                </p>
              </div>
              <div className="p-4 sm:p-5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Sesi Selesai</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-[#F1F6FA] mt-1 tabular-nums">
                  {completedCount}
                </p>
              </div>
              <div className="p-4 sm:p-5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Nota Sesi</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-[#F1F6FA] mt-1 tabular-nums">
                  {mentorLogs.length}
                </p>
              </div>
              <div className="p-4 sm:p-5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Surat Sokongan</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-[#F1F6FA] mt-1 tabular-nums">
                  {activeEndorsementCount}
                </p>
              </div>
            </div>

            {/* Pecahan Daerah & Sektor */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
              <div className={`rounded-2xl border overflow-hidden ${mentorTheme.surfaceClass}`}>
                <div className={`px-5 py-3.5 border-b ${mentorTheme.surfaceMutedClass} ${mentorTheme.dividerClass}`}>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-[#F1F6FA]">
                    Pecahan Mengikut Daerah
                  </h4>
                </div>
                {districtRows.length === 0 ? (
                  <p className="p-6 text-sm text-slate-500 dark:text-slate-400 text-center">
                    Tiada rekod daerah lagi.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className={`border-b text-xs font-semibold text-slate-500 dark:text-slate-400 ${mentorTheme.dividerClass}`}>
                          <th className="py-2.5 px-5">Daerah</th>
                          <th className="py-2.5 px-4 text-right">Mentee</th>
                          <th className="py-2.5 px-4 text-right">Sesi</th>
                          <th className="py-2.5 px-5 text-right">Sokongan</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y text-sm ${mentorTheme.dividerClass}`}>
                        {districtRows.map((row) => (
                          <tr key={row.district} className={mentorTheme.rowHoverClass}>
                            <td className="py-2.5 px-5 font-semibold text-slate-900 dark:text-[#F1F6FA]">
                              {row.district}
                            </td>
                            <td className="py-2.5 px-4 text-right tabular-nums text-slate-700 dark:text-slate-300">
                              {row.mentees}
                            </td>
                            <td className="py-2.5 px-4 text-right tabular-nums text-slate-700 dark:text-slate-300">
                              {row.sessions}
                            </td>
                            <td className="py-2.5 px-5 text-right tabular-nums font-semibold text-blue-700 dark:text-cyan-400">
                              {row.endorsements}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className={`rounded-2xl border overflow-hidden ${mentorTheme.surfaceClass}`}>
                <div className={`px-5 py-3.5 border-b ${mentorTheme.surfaceMutedClass} ${mentorTheme.dividerClass}`}>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-[#F1F6FA]">
                    Pecahan Mengikut Sektor
                  </h4>
                </div>
                {sectorRows.length === 0 ? (
                  <p className="p-6 text-sm text-slate-500 dark:text-slate-400 text-center">
                    Tiada rekod sektor lagi.
                  </p>
                ) : (
                  <div className={`divide-y ${mentorTheme.dividerClass}`}>
                    {sectorRows.map((row) => (
                      <div key={row.sector} className="px-5 py-3 flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                          {row.sector}
                        </span>
                        <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-[#F1F6FA] shrink-0">
                          {row.count} mentee
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ===================================================================== */}
      {/* TAB 4: PROFIL MENTOR & JADUAL KELAPANGAN                              */}
      {/* ===================================================================== */}
      {currentSubTab === 'profile' && (
        <div key="profile" className={`rounded-2xl border backdrop-blur-xs p-5 sm:p-6 space-y-5 animate-dashboard-tab ${mentorTheme.surfaceClass}`}>
          
          <div className={`pb-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${mentorTheme.dividerClass}`}>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-[#F1F6FA]">
                Profil &amp; Maklumat Mentor
              </h3>
              <p className="text-[0.9375rem] text-slate-600 dark:text-slate-300 mt-0.5">
                Maklumat ini dipaparkan kepada usahawan belia yang ingin memohon bimbingan perniagaan.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsEditProfileOpen(true)}
              className={`interactive-press px-4 py-2 font-semibold text-sm rounded-xl shadow-2xs flex items-center gap-2 shrink-0 self-start sm:self-auto cursor-pointer ${mentorTheme.primaryButtonClass}`}
            >
              <Edit3 className="w-4 h-4" />
              <span>Sunting Profil</span>
            </button>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 divide-y md:divide-y-0 ${mentorTheme.dividerClass}`}>
            <div className={`divide-y ${mentorTheme.dividerClass}`}>
              <div className="py-3 first:pt-0">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  Nama Penuh
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-[#F1F6FA]">
                  {currentMentor.name}
                </p>
              </div>

              <div className="py-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  Jawatan dan Agensi
                </span>
                <p className="text-sm font-medium text-slate-900 dark:text-[#F1F6FA]">
                  {currentMentor.title} &middot; <span className={`font-semibold ${mentorTheme.accentTextClass}`}>{currentMentor.agency}</span>
                </p>
              </div>

              <div className="py-3 last:pb-0 space-y-1.5">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                  Saluran Perhubungan
                </span>
                <div className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200">
                  <Phone className={`w-4 h-4 shrink-0 ${mentorTheme.accentTextClass}`} />
                  <span>WhatsApp: +{currentMentor.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200">
                  <Mail className={`w-4 h-4 shrink-0 ${mentorTheme.accentTextClass}`} />
                  <span>Emel Rasmi: {currentMentor.email}</span>
                </div>
              </div>
            </div>

            <div className={`divide-y pt-4 md:pt-0 ${mentorTheme.dividerClass}`}>
              <div className="py-3 first:pt-0">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  Jadual Bimbingan
                </span>
                <div className="text-sm font-bold text-slate-900 dark:text-[#F1F6FA] flex items-center gap-2">
                  <Clock className={`w-4 h-4 shrink-0 ${mentorTheme.accentTextClass}`} />
                  <span>{currentMentor.availableDays}</span>
                </div>
              </div>

              <div className="py-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">
                  Bidang Kepakaran
                </span>
                <div className="flex flex-wrap gap-2">
                  {currentMentor.expertise.map((exp, idx) => (
                    <span key={idx} className={`text-sm font-semibold ${mentorTheme.accentStrongTextClass}`}>
                      {exp}{idx < currentMentor.expertise.length - 1 ? ' ·' : ''}
                    </span>
                  ))}
                </div>
              </div>

              <div className="py-3 last:pb-0">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  Ringkasan Profil
                </span>
                <p className="text-[0.9375rem] text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
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
          <div className={`w-full max-w-xl rounded-3xl shadow-2xl border backdrop-blur-md max-h-[92vh] overflow-y-auto overflow-hidden ${mentorTheme.surfaceClass}`}>
            
            <div className={`px-6 sm:px-7 pt-6 pb-4 flex items-start justify-between gap-4 border-b ${mentorTheme.surfaceMutedClass} ${mentorTheme.dividerClass}`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${mentorTheme.surfaceClass} ${mentorTheme.dividerClass} ${mentorTheme.accentStrongTextClass}`}>
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-[#F1F6FA]">
                    Borang Perakuan Rasmi Geran Belia
                  </h3>
                  <p className="text-[0.875rem] text-slate-600 dark:text-slate-300">
                    Hab Usahawan Belia Kelantan (KBelia) &bull; Panel Bimbingan Mentor
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewEndorsementModalOpen(false)}
                className={`p-1.5 rounded-xl text-slate-500 dark:text-slate-400 transition-colors cursor-pointer ${mentorTheme.rowHoverClass}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGrantEndorsement} className="px-6 sm:px-7 pb-6 sm:pb-7 pt-4 space-y-3.5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Nama Penuh *
                  </label>
                  <input
                    type="text"
                    required
                    value={newEndorsementMenteeName}
                    onChange={(e) => setNewEndorsementMenteeName(e.target.value)}
                    placeholder="Masukkan nama penuh"
                    className={`w-full px-3 py-2 rounded-xl text-sm ${mentorTheme.inputClass}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Nama Perniagaan *
                  </label>
                  <input
                    type="text"
                    required
                    value={newEndorsementBusinessName}
                    onChange={(e) => setNewEndorsementBusinessName(e.target.value)}
                    placeholder="Masukkan nama perniagaan"
                    className={`w-full px-3 py-2 rounded-xl text-sm ${mentorTheme.inputClass}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Kategori Perniagaan
                  </label>
                  <select
                    value={newEndorsementCategory}
                    onChange={(e) => setNewEndorsementCategory(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-sm ${mentorTheme.inputClass}`}
                  >
                    <option value="Makanan & Minuman (F&B)">Makanan &amp; Minuman</option>
                    <option value="Fesyen, Batik & Kraf Kelantan">Fesyen, Batik & Kraf Kelantan</option>
                    <option value="Teknologi & Servis Digital">Teknologi & Servis Digital</option>
                    <option value="Kecantikan & Kesihatan">Kecantikan & Kesihatan</option>
                    <option value="Pertanian & Agrotek">Pertanian & Agrotek</option>
                    <option value="Runcit & Gaya Hidup">Runcit & Gaya Hidup</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Daerah
                  </label>
                  <select
                    value={newEndorsementDistrict}
                    onChange={(e) => setNewEndorsementDistrict(e.target.value as any)}
                    className={`w-full px-3 py-2 rounded-xl text-sm ${mentorTheme.inputClass}`}
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
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Jenis Geran Bantuan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewEndorsementGrantType('RM3,000')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      newEndorsementGrantType === 'RM3,000'
                        ? mentorTheme.activeNavClass
                        : mentorTheme.secondaryButtonClass
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
                        ? mentorTheme.activeNavClass
                        : mentorTheme.secondaryButtonClass
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
                        ? mentorTheme.activeNavClass
                        : mentorTheme.secondaryButtonClass
                    }`}
                  >
                    <div className="text-[0.8125rem] uppercase font-semibold">Dana Pertumbuhan</div>
                    <div className="text-sm font-black">RM10,000</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Justifikasi Perakuan *
                </label>
                <textarea
                  required
                  rows={3}
                  value={newEndorsementJustification}
                  onChange={(e) => setNewEndorsementJustification(e.target.value)}
                  placeholder="Masukkan justifikasi perakuan"
                  className={`w-full p-2.5 rounded-xl text-sm leading-relaxed font-sans ${mentorTheme.inputClass}`}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Catatan Kesediaan Operasi
                </label>
                <input
                  type="text"
                  value={newEndorsementReadiness}
                  onChange={(e) => setNewEndorsementReadiness(e.target.value)}
                  placeholder="Masukkan catatan kesediaan operasi"
                  className={`w-full px-3 py-2 rounded-xl text-sm ${mentorTheme.inputClass}`}
                />
              </div>

              <div className={`p-3 rounded-xl border ${mentorTheme.surfaceMutedClass} ${mentorTheme.dividerClass}`}>
                <label className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEndorsementConfirmed}
                    onChange={(e) => setIsEndorsementConfirmed(e.target.checked)}
                    className="mt-0.5 rounded w-4 h-4 accent-[#1D4ED8] dark:accent-[#38BDF8] cursor-pointer"
                  />
                  <span className="leading-relaxed">
                    Saya mengesahkan bahawa saya telah menyemak dokumen perniagaan dan membimbing usahawan belia ini. Perakuan ini dibuat dengan penuh integriti untuk semakan pihak pentadbir.
                  </span>
                </label>
              </div>

              <div className={`pt-3 border-t flex items-center justify-end gap-2 ${mentorTheme.dividerClass}`}>
                <button
                  type="button"
                  onClick={() => setIsNewEndorsementModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer ${mentorTheme.secondaryButtonClass}`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-xs flex items-center gap-1.5 cursor-pointer ${mentorTheme.primaryButtonClass}`}
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
                  className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-black border border-slate-300 text-sm font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak</span>
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
                  className={`px-3.5 py-2 text-sm font-semibold rounded-xl flex items-center gap-1.5 ${mentorTheme.primaryButtonClass}`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Muat Turun PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedEndorsementForView(null)}
                  className="p-1.5 rounded-xl text-black/70 hover:text-black hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Letterhead */}
            <div className="text-center space-y-1 pb-4 border-b-2 border-slate-900">
              <div className="flex items-center justify-center gap-3">
                <div className="px-2.5 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-black text-[0.8125rem] shrink-0">
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
                <span className="text-black/70 font-sans">Nombor Rujukan: </span>
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
          <div className={`w-full max-w-2xl rounded-3xl shadow-2xl border backdrop-blur-md max-h-[92vh] overflow-y-auto overflow-hidden ${mentorTheme.surfaceClass}`}>
            
            <div className={`px-6 sm:px-7 pt-6 pb-4 flex items-start justify-between gap-4 border-b ${mentorTheme.surfaceMutedClass} ${mentorTheme.dividerClass}`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${mentorTheme.surfaceClass} ${mentorTheme.dividerClass} ${mentorTheme.accentTextClass}`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-[#F1F6FA]">
                    {editingLogId ? 'Sunting Rekod Sesi Bimbingan' : 'Tambah Rekod Sesi Bimbingan'}
                  </h3>
                  <p className="text-[0.875rem] text-slate-600 dark:text-slate-300">
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
                className={`p-1.5 rounded-xl text-slate-500 dark:text-slate-400 transition-colors cursor-pointer ${mentorTheme.rowHoverClass}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLogEntry} className="px-6 sm:px-7 pb-6 sm:pb-7 pt-4 space-y-3.5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Nama Usahawan *
                  </label>
                  <input
                    type="text"
                    required
                    value={newLogMenteeName}
                    onChange={(e) => setNewLogMenteeName(e.target.value)}
                    placeholder="Masukkan nama usahawan"
                    className={`w-full px-3 py-2 rounded-xl text-sm ${mentorTheme.inputClass}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Nama Perniagaan *
                  </label>
                  <input
                    type="text"
                    required
                    value={newLogBusinessName}
                    onChange={(e) => setNewLogBusinessName(e.target.value)}
                    placeholder="Masukkan nama perniagaan"
                    className={`w-full px-3 py-2 rounded-xl text-sm ${mentorTheme.inputClass}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Topik Bimbingan *
                  </label>
                  <input
                    type="text"
                    required
                    value={newLogTopic}
                    onChange={(e) => setNewLogTopic(e.target.value)}
                    placeholder="Masukkan topik bimbingan"
                    className={`w-full px-3 py-2 rounded-xl text-sm ${mentorTheme.inputClass}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Tarikh Sesi
                  </label>
                  <ModernDatePicker
                    value={newLogSessionDate}
                    onChange={setNewLogSessionDate}
                    valueFormat="iso"
                    accentColor="blue"
                    placeholder="Tarikh sesi"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Ringkasan Perbincangan *
                </label>
                <textarea
                  required
                  rows={3}
                  value={newLogMinutes}
                  onChange={(e) => setNewLogMinutes(e.target.value)}
                  placeholder="Masukkan ringkasan perbincangan"
                  className={`w-full p-2.5 rounded-xl text-sm font-sans leading-relaxed ${mentorTheme.inputClass}`}
                />
              </div>

              <div className={`space-y-2.5 pt-3 border-t ${mentorTheme.dividerClass}`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <label className="block text-sm font-bold text-slate-900 dark:text-[#F1F6FA]">
                      Senarai Tugasan ({newLogTasks.length})
                    </label>
                    <p className="text-[0.8125rem] text-slate-500 dark:text-slate-400">
                      Tambah, sunting, atau padam tugasan susulan untuk sesi ini.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddModalTaskRow}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[0.8125rem] font-semibold shadow-2xs transition-colors cursor-pointer ${mentorTheme.primaryButtonClass}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Tugasan</span>
                  </button>
                </div>

                {newLogTasks.length === 0 ? (
                  <div className={`p-3.5 rounded-xl border border-dashed text-[0.8125rem] text-slate-600 dark:text-slate-300 flex flex-wrap items-center justify-between gap-2 ${mentorTheme.surfaceMutedClass} ${mentorTheme.dividerClass}`}>
                    <span>Tiada tugasan ditambah. Tekan Tambah Tugasan jika ada tindakan susulan.</span>
                    <button
                      type="button"
                      onClick={handleAddModalTaskRow}
                      className={`font-bold hover:underline shrink-0 cursor-pointer ${mentorTheme.accentTextClass}`}
                    >
                      + Tambah Baris
                    </button>
                  </div>
                ) : (
                  <div className={`divide-y ${mentorTheme.dividerClass}`}>
                    {newLogTasks.map((taskRow, idx) => (
                      <div
                        key={taskRow.id}
                        className="py-2.5 space-y-2"
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
                                    ? 'bg-[#1D4ED8] border-[#1D4ED8] dark:bg-[#0EA5E9] dark:border-[#0EA5E9] text-white dark:text-[#07111A]'
                                    : `border-slate-300 dark:border-slate-600 ${mentorTheme.surfaceClass}`
                                }`}
                              >
                                {taskRow.completed && <Check className="w-3.5 h-3.5" />}
                              </button>
                            )}
                            <span className="text-[0.8125rem] font-semibold text-slate-600 dark:text-slate-300">
                              Tugasan #{idx + 1}
                              {taskRow.completed ? ' (Selesai)' : ''}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveModalTaskRow(taskRow.id)}
                            aria-label={`Padam tugasan ${idx + 1}`}
                            title="Padam baris tugasan"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[0.8125rem] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
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
                            className={`sm:col-span-2 px-3 py-2 rounded-xl text-sm ${mentorTheme.inputClass}`}
                          />
                          <ModernDatePicker
                            value={taskRow.dueDate}
                            onChange={(val) =>
                              handleUpdateModalTaskRow(taskRow.id, { dueDate: val })
                            }
                            valueFormat="iso"
                            minDate={editingLogId ? undefined : toLocalIsoDate(new Date())}
                            accentColor="blue"
                            placeholder="Tarikh sasaran"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={`pt-3 border-t flex items-center justify-end gap-2 ${mentorTheme.dividerClass}`}>
                <button
                  type="button"
                  onClick={() => {
                    setIsNewLogModalOpen(false);
                    setEditingLogId(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer ${mentorTheme.secondaryButtonClass}`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-sm font-bold shadow-xs cursor-pointer ${mentorTheme.primaryButtonClass}`}
                >
                  Simpan
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
          <div className={`w-full max-w-lg rounded-3xl shadow-2xl border backdrop-blur-md max-h-[92vh] overflow-y-auto overflow-hidden ${mentorTheme.surfaceClass}`}>
            
            <div className={`px-6 sm:px-7 pt-6 pb-4 flex items-start justify-between gap-4 border-b ${mentorTheme.surfaceMutedClass} ${mentorTheme.dividerClass}`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${mentorTheme.surfaceClass} ${mentorTheme.dividerClass} ${mentorTheme.accentTextClass}`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-[#F1F6FA]">
                    Nota Nasihat &amp; Tindakan Usahawan
                  </h3>
                  <p className="text-[0.875rem] text-slate-600 dark:text-slate-300">
                    Untuk: <span className="font-bold text-slate-900 dark:text-[#F1F6FA]">{selectedMenteeForNotes.entrepreneurName}</span> ({selectedMenteeForNotes.businessName})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMenteeForNotes(null)}
                className={`p-1.5 rounded-xl text-slate-500 dark:text-slate-400 transition-colors cursor-pointer ${mentorTheme.rowHoverClass}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNotes} className="px-6 sm:px-7 pb-6 sm:pb-7 pt-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Pelan Tindakan
                </label>
                <textarea
                  rows={4}
                  value={actionPlanInput}
                  onChange={(e) => setActionPlanInput(e.target.value)}
                  placeholder="Masukkan pelan tindakan"
                  className={`w-full p-3 rounded-xl text-sm leading-relaxed font-sans ${mentorTheme.inputClass}`}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Catatan Mentor
                </label>
                <textarea
                  rows={2}
                  value={mentorNotesInput}
                  onChange={(e) => setMentorNotesInput(e.target.value)}
                  placeholder="Masukkan catatan mentor"
                  className={`w-full p-2.5 rounded-xl text-sm ${mentorTheme.inputClass}`}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Pautan Google Meet
                </label>
                <input
                  type="url"
                  value={meetLinkInput}
                  onChange={(e) => setMeetLinkInput(e.target.value)}
                  placeholder="Masukkan pautan Google Meet"
                  className={`w-full px-3 py-2 rounded-xl text-sm ${mentorTheme.inputClass}`}
                />
              </div>

              <div className={`pt-3 border-t flex items-center justify-end gap-2 ${mentorTheme.dividerClass}`}>
                <button
                  type="button"
                  onClick={() => setSelectedMenteeForNotes(null)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer ${mentorTheme.secondaryButtonClass}`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-sm font-bold shadow-xs flex items-center gap-1.5 cursor-pointer ${mentorTheme.primaryButtonClass}`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Simpan</span>
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
          <div className={`w-full max-w-md rounded-3xl shadow-2xl border backdrop-blur-md overflow-hidden ${mentorTheme.surfaceClass}`}>
            <div className={`px-6 pt-5 pb-4 flex items-center justify-between border-b ${mentorTheme.surfaceMutedClass} ${mentorTheme.dividerClass}`}>
              <h3 className="font-bold text-sm text-slate-900 dark:text-[#F1F6FA]">
                Buka Slot Jadual Bimbingan Baharu
              </h3>
              <button onClick={() => setIsNewSlotModalOpen(false)} className={`p-1.5 rounded-xl text-slate-500 dark:text-slate-400 cursor-pointer ${mentorTheme.rowHoverClass}`}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-3.5">
              <div>
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Tarikh Sesi
                </label>
                <ModernDatePicker
                  value={newSlotDate}
                  onChange={setNewSlotDate}
                  valueFormat="malay-day"
                  minDate={toLocalIsoDate(new Date())}
                  accentColor="blue"
                  placeholder="Pilih tarikh sesi"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Masa Sesi
                </label>
                <ModernTimePicker
                  value={newSlotTime}
                  onChange={setNewSlotTime}
                  mode="range"
                  allowRangeToggle
                  formatStyle="12h-am"
                  defaultDurationMinutes={60}
                  accentColor="blue"
                  placeholder="Pilih masa sesi"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Mod Sesi
                </label>
                <select
                  value={newSlotMode}
                  onChange={(e) => setNewSlotMode(e.target.value as any)}
                  className={`w-full px-3 py-2 rounded-xl text-sm ${mentorTheme.inputClass}`}
                >
                  <option value="Bersemuka di Kampus">Bersemuka di Hab Usahawan (Bilik Bimbingan KBelia)</option>
                  <option value="Google Meet">Google Meet</option>
                </select>
              </div>

              <div className={`pt-3 border-t flex justify-end gap-2 ${mentorTheme.dividerClass}`}>
                <button
                  type="button"
                  onClick={() => setIsNewSlotModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer ${mentorTheme.secondaryButtonClass}`}
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
                  className={`px-4 py-2 rounded-xl text-sm font-bold shadow-xs cursor-pointer ${mentorTheme.primaryButtonClass}`}
                >
                  Terbit
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
