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
  Lock,
  Edit3,
  Trash2,
  ShieldCheck,
  Printer,
  Download,
  Copy,
  Plus,
  ArrowRight,
  FileCheck,
  BarChart3,
  ClipboardCheck,
  Search,
  MessageCircle,
  Eye,
  LayoutGrid,
  List,
  FileSpreadsheet,
  QrCode,
  CheckSquare
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
  generateMentorSummaryReportHtml,
  generateMentorLogbookOfficialHtml
} from '../utils/printUtils';
import { exportMentorReportToExcel } from '../utils/excelExport';
import { downloadHtmlAsPdf } from '../utils/pdfGenerator';
import { useAuth } from '../context/AuthContext';
import { useConfirmDelete } from '../context/ConfirmDeleteContext';
import { useLanguage } from '../context/LanguageContext';
import { MentorProfileEditModal } from './MentorProfileEditModal';
import { MentorScheduleCalendar } from './MentorScheduleCalendar';
import { emitAdminOrMentorNotification } from '../services/notificationStore';
import { showToast as triggerToast } from './ToastNotification';
import { QrCodeGraphic } from './QrCodeGraphic';
import { buildVerificationQrPayload } from '../utils/qrUtils';
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
import { AcronymText, MiddleTruncate } from './TypographyPrimitives';

const mentorTheme = getRoleTheme('mentor');

const LOGBOOK_QUICK_TEMPLATES: {
  id: string;
  label: string;
  topic: string;
  minutes: string;
  tasks: string[];
}[] = [
  {
    id: 'cashflow',
    label: 'Semakan Aliran Tunai',
    topic: 'Semakan Aliran Tunai, Kos Operasi & Pemisahan Akaun Perniagaan',
    minutes:
      'Menyemak rekod jualan tunai dan DuitNow QR bulanan bersama usahawan. Mengasingkan akaun bank perniagaan daripada perbelanjaan peribadi serta menetapkan sasaran margin keuntungan bersih sekurang-kurangnya 30%.',
    tasks: [
      'Asingkan rekod jualan harian & kos bahan mentah dalam lejar aliran tunai',
      'Gunakan akaun bank berasingan bagi semua terimaan pembayaran QR',
      'Sediakan ringkasan untung rugi bulanan untuk semakan sesi berikutnya'
    ]
  },
  {
    id: 'marketing',
    label: 'Strategi Pemasaran Digital',
    topic: 'Pecutan Pemasaran Digital, Katalog WhatsApp & Konten Video Pendek',
    minutes:
      'Membincangkan strategi penjenamaan semula di media sosial serta pengoptimuman WhatsApp Business Catalog. Menetapkan jadual kandungan mingguan dan tawaran pakej kombo untuk meningkatkan kadar belian ulang.',
    tasks: [
      'Kemaskini katalog produk lengkap dengan harga & gambar di WhatsApp Business',
      'Hasilkan 3 video pendek demonstrasi produk atau testimoni pelanggan',
      'Aktifkan pautan kad digital KBelia pada bio semua saluran sosial'
    ]
  },
  {
    id: 'packaging',
    label: 'Pembungkusan & Label',
    topic: 'Penambahbaikan Pembungkusan, Pematuhan Label & Daya Tahan Produk',
    minutes:
      'Menilai kualiti pembungkusan semasa untuk kesesuaian jualan di kiosk modular dan penghantaran pos. Menasihatkan penambahan maklumat tarikh luput, berat bersih, ramuan dan nombor hubungan pada label.',
    tasks: [
      'Dapatkan sebut harga daripada 2 pembekal pembungkusan atau pelekat label',
      'Kemaskini reka bentuk label dengan maklumat pemakanan & tarikh luput',
      'Uji ketahanan pembungkusan untuk penghantaran kurier luar daerah'
    ]
  },
  {
    id: 'grant-prep',
    label: 'Persediaan Geran KBelia',
    topic: 'Audit Dokumen & Persediaan Permohonan Geran Usahawan Belia',
    minutes:
      'Menyemak kelengkapan 4 syarat asas kelayakan geran termasuk sijil SSM aktif, penyata jualan 3 bulan, pelan penggunaan dana peralatan dan unjuran peningkatan kapasiti pengeluaran.',
    tasks: [
      'Muat naik salinan sijil SSM terkini & penyata bank 3 bulan',
      'Lengkapkan sebut harga rasmi peralatan atau mesin yang dipohon',
      'Semak draf unjuran pulangan pelaburan sebelum permohonan dihantar'
    ]
  }
];

const ENDORSEMENT_JUSTIFICATION_TEMPLATES: {
  id: string;
  label: string;
  category: string;
  justification: string;
  readiness: string;
}[] = [
  {
    id: 'fnb',
    label: 'F&B & Retort',
    category: 'Makanan & Minuman (F&B)',
    justification:
      'Usahawan menunjukkan prestasi jualan harian yang konsisten serta permintaan berulang daripada pelanggan setempat. Perolehan peralatan pemprosesan dan pembungkusan retort akan meningkatkan kapasiti pengeluaran serta memanjangkan jangka hayat produk untuk pasaran lebih luas.',
    readiness:
      'SSM aktif, mempunyai rekod jualan tunai & QR yang teratur, serta mematuhi piawaian kebersihan penyediaan makanan.'
  },
  {
    id: 'digital',
    label: 'Digital & Perisian',
    category: 'Teknologi & Servis Digital',
    justification:
      'Usahawan menawarkan penyelesaian digital yang praktikal dan telah diuji oleh pelanggan perniagaan tempatan. Dana geran disyorkan bagi menaik taraf infrastruktur awan, lesen perisian, dan pemasaran pemerolehan pelanggan B2B.',
    readiness:
      'Prototaip aktif beroperasi dengan pelanggan berbayar serta struktur harga langganan yang mampan.'
  },
  {
    id: 'craft',
    label: 'Batik & Kraf',
    category: 'Fesyen, Batik & Kraf Kelantan',
    justification:
      'Produk mengekalkan identiti warisan Kelantan dengan sentuhan rekaan moden yang diminati segmen pelancongan dan belia. Bantuan modal amat diperlukan bagi pembelian bahan mentah berkualiti dan penghasilan kandungan promosi digital.',
    readiness:
      'Mempunyai bengkel operasi tetap, sampel produk siap dipasarkan, dan rekod tempahan berkala.'
  },
  {
    id: 'agro',
    label: 'Pertanian & Agro',
    category: 'Pertanian & Agrotek',
    justification:
      'Usahawan mengamalkan pengurusan ladang dan hasil tani yang tersusun dengan kebolehan pembekalan terus ke pasaran tempatan. Sokongan geran akan digunakan bagi kelengkapan sistem fertigasi dan pembungkusan hasil segar.',
    readiness:
      'Tapak projek beroperasi aktif, pendaftaran perniagaan lengkap, serta mempunyai pembeli tetap mingguan.'
  }
];

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

  // Split-Pane & Workspace View States across Mentor Portal tabs
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [selectedMenteeKey, setSelectedMenteeKey] = useState<string>('');
  const [menteeViewMode, setMenteeViewMode] = useState<'list' | 'cards'>('list');
  const [selectedLogId, setSelectedLogId] = useState<string>('');
  const [selectedEndorsementId, setSelectedEndorsementId] = useState<string>('');
  const [readinessFilterTab, setReadinessFilterTab] = useState<'all' | 'ready' | 'incomplete' | 'endorsed'>('all');

  // Mentee Directory & Grant Check Filter States
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
  const confirmedCount = mentorRegistrations.filter(r => r.status === 'confirmed').length;
  const completedCount = mentorRegistrations.filter(r => r.status === 'completed').length;
  const totalEndorsementsCount = mentorEndorsements.length;
  const totalLogbookCount = mentorLogs.length;

  // Unconditional 7-item pagination hooks across MentorPortal lists
  const overviewPagination = usePagination(overviewRegistrations, 7, [overviewSearch, overviewStatusFilter, overviewDistrictFilter, overviewSortPreset, overviewSortBy, overviewSortDir, currentMentor.id]);
  const applicationsPagination = usePagination(filteredRegistrations, 7, [searchQuery, statusFilter, modeFilter, applicationsSortPreset, applicationsSortBy, applicationsSortDir, currentMentor.id]);
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
    setSelectedEndorsementId(newEndorsement.id);
    setSelectedEndorsementForView(newEndorsement);
    showToast(`Surat Perakuan Rasmi ${uniqueCode} berjaya dikeluarkan!`);

    // Reset form
    setNewEndorsementMenteeName('');
    setNewEndorsementBusinessName('');
    setNewEndorsementJustification('');
    setNewEndorsementReadiness('');
    setIsEndorsementConfirmed(false);
  };

  const openCreateLogFromTemplate = (
    template: (typeof LOGBOOK_QUICK_TEMPLATES)[number],
    menteeName = '',
    businessName = ''
  ) => {
    setEditingLogId(null);
    setNewLogMenteeName(menteeName);
    setNewLogBusinessName(businessName);
    setNewLogSessionDate(toLocalIsoDate(new Date()));
    setNewLogTopic(template.topic);
    setNewLogMinutes(template.minutes);
    setNewLogTasks(
      template.tasks.map((t, idx) => ({
        id: `act-${Date.now()}-${idx + 1}`,
        task: t,
        dueDate: getPlusDaysIso((idx + 1) * 7),
        completed: false
      }))
    );
    setIsNewLogModalOpen(true);
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
      triggerToast('Sila isi nama belia, bisnes, topik dan minit bimbingan.', 'error');
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
      setSelectedLogId(editingLogId);
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
    setSelectedLogId(newEntry.id);
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

      {/* 1. MENTOR PORTAL HEADER: KBelia Editorial Hero */}
      <div className={`relative overflow-hidden kbelia-ambient-sheen-soft rounded-2xl border backdrop-blur-xs p-5 sm:p-6 transition-colors ${mentorTheme.surfaceClass}`}>
        <div className="pointer-events-none absolute -top-14 -left-10 w-52 h-52 rounded-full bg-[#2563EB]/10 blur-3xl animate-ambient-orb-a" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-16 right-8 w-48 h-48 rounded-full bg-[#0D9488]/10 blur-3xl animate-ambient-orb-b" aria-hidden="true" />

        {(() => {
          const mentorDisplayName = currentMentor?.name || userProfile?.fullName || 'Prof. Madya Dr. Wan Azhar';

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
              prefix: !isEn ? 'Senarai ' : 'Youth ',
              accent: !isEn ? 'Belia' : 'Directory'
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

          return (
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  {!isEn ? 'Rangkaian Seluruh Negeri Kelantan' : 'Kelantan Statewide Network'}
                </p>
                <h1 className="font-display text-fluid-portal font-bold tracking-tight text-slate-900 dark:text-[#F1F5F9] leading-tight kbelia-trim">
                  {currentMentorHeader.prefix}
                  <span className={mentorTheme.accentTextClass}>{currentMentorHeader.accent}</span>
                </h1>
                <p className="text-[0.9375rem] text-slate-600 dark:text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
                  {!isEn ? (
                    <>
                      Selamat kembali, <span className="font-semibold text-slate-900 dark:text-[#F1F5F9]">{mentorDisplayName}</span>
                    </>
                  ) : (
                    <>
                      Welcome back, <span className="font-semibold text-slate-900 dark:text-[#F1F5F9]">{mentorDisplayName}</span>
                    </>
                  )}
                </p>
              </div>
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
          {/* Quick Actions Bar */}
          <div className={`rounded-2xl border backdrop-blur-xs p-3.5 sm:px-5 flex flex-wrap items-center justify-start gap-3 ${mentorTheme.surfaceClass}`}>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {!isEn ? 'Tindakan Pantas' : 'Quick Actions'}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenCreateSlotWithPrefill()}
                className={`px-3.5 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 ${mentorTheme.primaryButtonClass}`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{!isEn ? 'Buka Slot' : 'Create Slot'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleSubTabChange('sessions')}
                className={`px-3.5 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 ${mentorTheme.secondaryButtonClass}`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{!isEn ? `Semak Sesi (${pendingCount})` : `Review Sessions (${pendingCount})`}</span>
              </button>
              <button
                type="button"
                onClick={openCreateLogModal}
                className={`px-3.5 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 ${mentorTheme.secondaryButtonClass}`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{!isEn ? 'Tulis Rekod Sesi' : 'Write Session Note'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleSubTabChange('readiness')}
                className={`px-3.5 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 ${mentorTheme.secondaryButtonClass}`}
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>{!isEn ? 'Semak Geran' : 'Grant Check'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleSubTabChange('impact')}
                className={`px-3.5 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 ${mentorTheme.secondaryButtonClass}`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>{!isEn ? 'Laporan Ringkas' : 'Summary Report'}</span>
              </button>
            </div>
          </div>

          {/* Open Editorial 4-Column Summary Strip */}
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
              className={`animate-dashboard-card lg:col-span-2 h-full w-full rounded-2xl backdrop-blur-xs p-4 sm:p-5 border transition-all duration-200 min-w-0 flex flex-col ${mentorTheme.surfaceClass}`}
            >
              <div className={`flex flex-wrap items-center justify-between gap-2 pb-3 border-b mb-3 shrink-0 ${mentorTheme.dividerClass}`}>
                <div className="flex items-center gap-2">
                  <BarChart3 className={`w-5 h-5 shrink-0 ${mentorTheme.accentTextClass}`} />
                  <h3 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-[#F1F5F9] tracking-tight">
                    Perkembangan Bimbingan Mengikut Lokasi
                  </h3>
                </div>
                <span className={`text-[0.8125rem] font-medium ${mentorTheme.accentTextClass}`}>
                  Rangkaian Seluruh Negeri Kelantan
                </span>
              </div>

              <div className="relative flex-1 min-h-[260px] w-full min-w-0 [&_.recharts-cartesian-axis-tick_text]:fill-slate-600 dark:[&_.recharts-cartesian-axis-tick_text]:fill-slate-300">
                <div className="absolute inset-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 640, height: 280 }}>
                  <BarChart
                    data={mentorChartData}
                    barCategoryGap="16%"
                    barGap={4}
                    margin={{ top: 18, right: 12, left: -4, bottom: 6 }}
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
                              <div className="opacity-90">Sokongan Geran: {d.perakuan}</div>
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
                      name="Sokongan Geran"
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
            </div>

            <RoleDonutCard
              className="lg:col-span-1 h-full"
              role="mentor"
              title="Pecahan Tahap Sokongan"
              icon={Award}
              segments={endorsementTierSegments}
              centerValue={centerEndorsedDisplay}
              centerLabel="Nilai Sokongan"
              valueUnit="surat"
              summaryPairs={[
                { label: 'Sokongan Aktif', value: activeEndorsementsList.length > 0 ? `${activeEndorsementsList.length} Surat` : 'Tiada', dotColor: mentorTheme.chartPrimary },
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">

            {/* Lajur Kiri: Jadual Sesi Terdekat */}
            <div
              style={{ '--stagger': 5 } as React.CSSProperties}
              className={`animate-dashboard-card min-w-0 rounded-2xl p-4 sm:p-5 border backdrop-blur-xs transition-all duration-200 flex flex-col justify-start ${mentorTheme.surfaceClass}`}
            >
              <div className={`flex items-center gap-2 pb-3 border-b mb-1 ${mentorTheme.dividerClass}`}>
                <Calendar className={`w-4.5 h-4.5 shrink-0 ${mentorTheme.accentTextClass}`} />
                <h3 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-[#F1F5F9] tracking-tight">
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
                            onClick={() => {
                              setSelectedSessionId(reg.id);
                              if (reg.status === 'completed') setStatusFilter('completed');
                              else setStatusFilter('all');
                              handleSubTabChange('sessions');
                            }}
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
              <div className={`flex items-center gap-2 pb-3 border-b mb-1 ${mentorTheme.dividerClass}`}>
                <Award className={`w-4.5 h-4.5 shrink-0 ${mentorTheme.accentStrongTextClass}`} />
                <h3 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-[#F1F5F9] tracking-tight">
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
                          setSelectedEndorsementId(end.id);
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
            <div className="flex items-center gap-2">
              <h3 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-[#F1F5F9] tracking-tight">
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
                                {hasEndorsement ? 'Sokongan Disahkan' : 'Belum Disokong'}
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
                                    onClick: () => {
                                      setSelectedSessionId(mentee.id);
                                      if (mentee.status === 'completed') setStatusFilter('completed');
                                      else setStatusFilter('all');
                                      handleSubTabChange('sessions');
                                    },
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
      {/* TAB 1: SESI BIMBINGAN (GMAIL TABS + SPLIT-PANE SIDE PREVIEW)          */}
      {/* ===================================================================== */}
      {currentSubTab === 'sessions' && (() => {
        const activeSession =
          filteredRegistrations.find((r) => r.id === selectedSessionId) ||
          filteredRegistrations[0] ||
          null;

        const sessionTabs: {
          id: 'all' | 'pending' | 'confirmed' | 'completed';
          label: string;
          count: number;
        }[] = [
          { id: 'all', label: !isEn ? 'Semua Aktif' : 'Active', count: activeCount },
          { id: 'pending', label: !isEn ? 'Menunggu' : 'Pending', count: pendingCount },
          { id: 'confirmed', label: !isEn ? 'Disahkan' : 'Confirmed', count: confirmedCount },
          { id: 'completed', label: !isEn ? 'Selesai' : 'Completed', count: completedCount }
        ];

        const activeVisuals = activeSession
          ? resolveMenteeVisuals(
              {
                applicantId: activeSession.applicantId,
                entrepreneurName: activeSession.entrepreneurName,
                businessName: activeSession.businessName,
                category: activeSession.businessCategory
              },
              businesses
            )
          : null;
        const activeRawPhone = activeSession
          ? activeSession.entrepreneurPhone || (activeSession as any).phone || ''
          : '';
        const activeCleanPhone =
          typeof activeRawPhone === 'string' ? activeRawPhone.replace(/[^0-9]/g, '') : '';
        const activeMode = activeSession
          ? activeSession.meetingLink
            ? 'Google Meet'
            : normalizeMentorshipMode(activeSession.mode)
          : 'Bersemuka di Kampus';

        return (
          <div key="sessions" className="space-y-4 animate-dashboard-tab">
            {/* Clean Workspace Header + Gmail Underline Tabs */}
            <div className={`rounded-2xl border overflow-hidden ${mentorTheme.surfaceClass}`}>
              <div className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Calendar className={`w-5 h-5 shrink-0 ${mentorTheme.accentTextClass}`} />
                  <div>
                    <h3 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-[#F1F5F9] tracking-tight">
                      {!isEn ? 'Pengurusan Sesi Bimbingan' : 'Coaching Sessions'}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      {!isEn
                        ? 'Pilih mana-mana permohonan di kiri untuk pratonton penuh, pautan Meet, dan tindakan pengesahan.'
                        : 'Select any request on the left for full preview, Meet link, and confirmation actions.'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSubTabChange('schedule')}
                    className={`px-3.5 py-2 text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 ${mentorTheme.secondaryButtonClass}`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>{!isEn ? 'Kalendar Penuh' : 'Full Calendar'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNewSlotModalOpen(true)}
                    className={`px-4 py-2 text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 ${mentorTheme.primaryButtonClass}`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>{!isEn ? 'Buka Slot' : 'Create Slot'}</span>
                  </button>
                </div>
              </div>

              {/* Editorial Underline Tabs */}
              <div className={`px-4 sm:px-5 border-t flex items-center justify-between flex-wrap gap-3 ${mentorTheme.dividerClass}`}>
                <div className="flex items-center gap-5 overflow-x-auto">
                  {sessionTabs.map((tab) => {
                    const isTabActive = statusFilter === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setStatusFilter(tab.id)}
                        className={`py-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-2 cursor-pointer ${
                          isTabActive
                            ? mentorTheme.tabActiveUnderlineClass
                            : mentorTheme.tabIdleUnderlineClass
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[11px] font-bold tabular-nums ${
                            isTabActive
                              ? mentorTheme.activeNavClass
                              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Search & Mode Filter */}
                <div className="flex flex-wrap items-center gap-2 py-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={!isEn ? 'Cari usahawan, topik...' : 'Search youth, topic...'}
                      className={`pl-9 pr-3 py-1.5 rounded-xl text-xs sm:text-sm w-44 sm:w-56 ${mentorTheme.inputClass}`}
                    />
                  </div>
                  <select
                    value={modeFilter}
                    onChange={(e) => setModeFilter(e.target.value as 'all' | 'Bersemuka di Kampus' | 'Google Meet')}
                    className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm cursor-pointer ${mentorTheme.inputClass}`}
                  >
                    <option value="all">{!isEn ? 'Semua Mod' : 'All Modes'}</option>
                    <option value="Google Meet">Google Meet</option>
                    <option value="Bersemuka di Kampus">{!isEn ? 'Bersemuka' : 'In-Person'}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Split-Pane Layout: Left Session Queue (45%) | Right Live Detail Side Panel (55%) */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,45fr)_minmax(0,55fr)] gap-4 items-stretch">
              {/* Left Pane: Queue List */}
              <div className={`rounded-2xl border backdrop-blur-xs overflow-hidden flex flex-col ${mentorTheme.surfaceClass}`}>
                {filteredRegistrations.length === 0 ? (
                  <div className="py-12 px-4 text-center space-y-2">
                    <GraduationCap className="w-9 h-9 text-slate-400 dark:text-slate-500 mx-auto opacity-60" />
                    <p className="text-sm font-semibold text-slate-900 dark:text-[#F1F5F9]">
                      {!isEn ? 'Tiada rekod sesi ditemui.' : 'No sessions found.'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {!isEn ? 'Cuba tukar tab status atau kata kunci carian.' : 'Try changing the status tab or search query.'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className={`divide-y ${mentorTheme.dividerClass}`}>
                      {applicationsPagination.paginatedItems.map((mentee) => {
                        const isSelected = activeSession?.id === mentee.id;
                        const isPending = mentee.status === 'pending';
                        const isConfirmed = mentee.status === 'confirmed';
                        const isCompleted = mentee.status === 'completed';
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
                          <button
                            key={mentee.id}
                            type="button"
                            onClick={() => setSelectedSessionId(mentee.id)}
                            className={`w-full text-left p-3.5 sm:px-4 flex items-start gap-3 transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#1D4ED8]/10 dark:bg-[#3B82F6]/18'
                                : mentorTheme.rowHoverClass
                            }`}
                          >
                            <div className={`w-11 h-11 rounded-xl overflow-hidden border shrink-0 bg-slate-100 dark:bg-slate-800 ${mentorTheme.dividerClass}`}>
                              <PortalImage
                                src={visuals.businessUrl}
                                alt={mentee.businessName}
                                fallbackType="business"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`text-sm font-bold truncate ${isSelected ? mentorTheme.accentTextClass : 'text-slate-900 dark:text-[#F1F5F9]'}`}>
                                  {mentee.entrepreneurName}
                                </span>
                                <span
                                  className={`text-[11px] font-semibold shrink-0 px-2 py-0.5 rounded-lg ${
                                    isCompleted
                                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                      : isConfirmed
                                      ? 'bg-[#1D4ED8]/12 text-[#1D4ED8] dark:bg-[#3B82F6]/20 dark:text-[#93C5FD]'
                                      : isPending
                                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                                  }`}
                                >
                                  {isCompleted ? 'Selesai' : isConfirmed ? 'Disahkan' : isPending ? 'Menunggu' : 'Dibatalkan'}
                                </span>
                              </div>
                              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate">
                                {mentee.businessName} &middot; {mentee.district || 'Kelantan'}
                              </p>
                              <p className="text-xs text-slate-800 dark:text-slate-200 truncate font-medium">
                                {mentee.topic}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                                <Clock className="w-3 h-3 shrink-0" />
                                <span>{mentee.preferredDate || 'Fleksibel'} &middot; {mentee.preferredTime || '10:00 AM'}</span>
                                <span>&middot;</span>
                                <span>{mentee.meetingLink || normalizeMentorshipMode(mentee.mode) === 'Google Meet' ? 'Google Meet' : 'Bersemuka'}</span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <PaginationBar
                      currentPage={applicationsPagination.currentPage}
                      totalItems={applicationsPagination.totalItems}
                      itemsPerPage={7}
                      onPageChange={applicationsPagination.setCurrentPage}
                      itemLabel="sesi"
                    />
                  </>
                )}
              </div>

              {/* Right Pane: Side Detail Preview Panel */}
              <div className={`rounded-2xl border backdrop-blur-xs overflow-hidden ${mentorTheme.surfaceClass}`}>
                {!activeSession ? (
                  <div className="py-16 px-6 text-center space-y-2">
                    <Calendar className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto opacity-50" />
                    <p className="text-sm font-semibold text-slate-900 dark:text-[#F1F5F9]">
                      {!isEn ? 'Pilih sesi daripada senarai di sebelah kiri' : 'Select a session from the list'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {!isEn ? 'Butiran cabaran usahawan, pautan Google Meet dan nota bimbingan akan dipaparkan di sini.' : 'Challenge notes, Meet links, and action plans appear here.'}
                    </p>
                  </div>
                ) : (
                  <div>
                    {/* Side Panel Header */}
                    <div className={`p-5 border-b flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${mentorTheme.surfaceMutedClass} ${mentorTheme.dividerClass}`}>
                      <div className="flex items-start gap-3.5 min-w-0">
                        {activeVisuals && (
                          <div className={`w-14 h-14 rounded-2xl overflow-hidden border shrink-0 bg-white dark:bg-slate-900 ${mentorTheme.dividerClass}`}>
                            <PortalImage
                              src={activeVisuals.businessUrl}
                              alt={activeSession.businessName}
                              fallbackType="business"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-[#F1F5F9] truncate">
                              {activeSession.entrepreneurName}
                            </h4>
                            <span
                              className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold ${
                                activeSession.status === 'completed'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                  : activeSession.status === 'confirmed'
                                  ? mentorTheme.activeNavClass
                                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                              }`}
                            >
                              {activeSession.status === 'completed'
                                ? 'Selesai'
                                : activeSession.status === 'confirmed'
                                ? 'Disahkan'
                                : 'Menunggu Pengesahan'}
                            </span>
                          </div>
                          <p className={`text-sm font-semibold ${mentorTheme.accentTextClass}`}>
                            {activeSession.businessName}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              <span>{activeSession.district || 'Kelantan'}</span>
                            </span>
                            <span>&middot;</span>
                            <span>{activeSession.businessCategory || 'Perniagaan Belia'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {activeCleanPhone && (
                          <a
                            href={`https://wa.me/${activeCleanPhone}?text=${encodeURIComponent(`Salam ${activeSession.entrepreneurName}, saya mentor anda dari Hab Usahawan KBelia.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`px-3.5 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 ${mentorTheme.secondaryButtonClass}`}
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Side Panel Body */}
                    <div className="p-4 sm:p-5 space-y-4">
                      {/* Schedule & Channel Box */}
                      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl border ${mentorTheme.surfaceMutedClass} ${mentorTheme.dividerClass}`}>
                        <div>
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                            Topik Utama
                          </span>
                          <span className="text-sm font-semibold text-slate-900 dark:text-[#F1F5F9] mt-0.5 block">
                            {activeSession.topic}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                            Tarikh &amp; Masa
                          </span>
                          <span className="text-sm font-semibold text-slate-900 dark:text-[#F1F5F9] mt-0.5 block tabular-nums">
                            {activeSession.preferredDate || 'Fleksibel'} &middot; {activeSession.preferredTime || '10:00 AM'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                            Mod Bimbingan
                          </span>
                          <span className={`text-sm font-semibold mt-0.5 inline-flex items-center gap-1.5 ${mentorTheme.accentTextClass}`}>
                            {activeMode === 'Google Meet' ? <Video className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
                            <span>{activeMode === 'Google Meet' ? 'Google Meet' : 'Bersemuka di Hab'}</span>
                          </span>
                        </div>
                      </div>

                      {/* Google Meet Link Action Strip */}
                      {activeSession.meetingLink && (
                        <div className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${mentorTheme.surfaceMutedClass} ${mentorTheme.dividerClass}`}>
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                              Pautan Panggilan Video Google Meet
                            </span>
                            <span className={`text-xs font-mono truncate block ${mentorTheme.accentTextClass}`}>
                              {activeSession.meetingLink}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard?.writeText(activeSession.meetingLink || '');
                                showToast('Pautan Google Meet disalin.');
                              }}
                              className={`px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 ${mentorTheme.secondaryButtonClass}`}
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Salin</span>
                            </button>
                            <a
                              href={activeSession.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`px-3.5 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 ${mentorTheme.primaryButtonClass}`}
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>Buka Meet</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Entrepreneur Challenge Message */}
                      <div className="space-y-1.5">
                        <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <MessageSquare className={`w-3.5 h-3.5 ${mentorTheme.accentTextClass}`} />
                          <span>Mesej Permohonan &amp; Cabaran Usahawan</span>
                        </h5>
                        <div className={`p-3.5 rounded-xl border text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line ${mentorTheme.surfaceMutedClass} ${mentorTheme.dividerClass}`}>
                          {activeSession.challenges
                            ? `"${activeSession.challenges}"`
                            : 'Usahawan memohon sesi bimbingan khusus bagi strategi pemasaran, pengurusan kos operasi, dan persediaan dokumentasi permohonan geran belia.'}
                        </div>
                      </div>

                      {/* Saved Action Plan & Notes */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <FileText className={`w-3.5 h-3.5 ${mentorTheme.accentTextClass}`} />
                            <span>Nota Bimbingan &amp; Pelan Tindakan</span>
                          </h5>
                          <button
                            type="button"
                            onClick={() => handleOpenNotesModal(activeSession)}
                            className={`text-xs font-semibold hover:underline cursor-pointer ${mentorTheme.accentTextClass}`}
                          >
                            {activeSession.mentorActionPlan ? 'Kemaskini Nota' : '+ Tambah Nota'}
                          </button>
                        </div>
                        {activeSession.mentorActionPlan || activeSession.notes ? (
                          <div className={`p-3.5 rounded-xl border space-y-2 text-sm text-slate-800 dark:text-slate-200 ${mentorTheme.surfaceMutedClass} ${mentorTheme.dividerClass}`}>
                            {activeSession.mentorActionPlan && (
                              <p className="whitespace-pre-line leading-relaxed">{activeSession.mentorActionPlan}</p>
                            )}
                            {activeSession.notes && (
                              <p className={`text-xs text-slate-600 dark:text-slate-400 pt-1 border-t ${mentorTheme.dividerClass}`}>
                                Catatan Mentor: {activeSession.notes}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                            Belum ada nota pelan tindakan direkodkan bagi sesi ini.
                          </p>
                        )}
                      </div>

                      {/* Primary Action Footer */}
                      <div className={`pt-4 border-t flex flex-wrap items-center justify-between gap-2.5 ${mentorTheme.dividerClass}`}>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openCreateLogForMentee(activeSession.entrepreneurName, activeSession.businessName)
                            }
                            className={`px-3.5 py-2 text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 ${mentorTheme.secondaryButtonClass}`}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Tulis Rekod Sesi</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setNewEndorsementMenteeName(activeSession.entrepreneurName);
                              setNewEndorsementBusinessName(activeSession.businessName);
                              setNewEndorsementDistrict(activeSession.district);
                              setIsNewEndorsementModalOpen(true);
                            }}
                            className={`px-3.5 py-2 text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 ${mentorTheme.secondaryButtonClass}`}
                          >
                            <Award className={`w-3.5 h-3.5 ${mentorTheme.accentStrongTextClass}`} />
                            <span>Sokongan Geran</span>
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {activeSession.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(activeSession, 'confirmed')}
                              className={`px-4 py-2 text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 ${mentorTheme.primaryButtonClass}`}
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Sahkan Sesi</span>
                            </button>
                          )}
                          {activeSession.status === 'confirmed' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(activeSession, 'completed')}
                              className={`px-4 py-2 text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 ${mentorTheme.primaryButtonClass}`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Tandakan Selesai</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenNotesModal(activeSession)}
                            className={`px-3.5 py-2 text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 ${mentorTheme.secondaryButtonClass}`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{activeSession.mentorActionPlan ? 'Kemaskini Nota' : 'Tambah Nota'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ===================================================================== */}
      {/* ===================================================================== */}
      {/* TAB 1A: SENARAI MENTEE (GOOGLE CONTACTS VIEW TOGGLE + SIDE PROFILE)   */}
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

        const activeMentee =
          filteredMentees.find((m) => m.key === selectedMenteeKey) || filteredMentees[0] || null;

        const getCheckScore = (menteeKey: string) => {
          const savedCheck = grantChecks.find(
            (c) => c.mentorId === currentMentor.id && c.menteeKey === menteeKey
          );
          return savedCheck
            ? [savedCheck.hasSsm, savedCheck.hasSalesRecord, savedCheck.attendedSession, savedCheck.productReady].filter(Boolean).length
            : null;
        };

        const activeMenteeScore = activeMentee ? getCheckScore(activeMentee.key) : null;
        const activeMenteeLogs = activeMentee
          ? mentorLogs.filter(
              (l) =>
                l.businessName.trim().toLowerCase() === activeMentee.businessName.trim().toLowerCase() ||
                l.menteeName.trim().toLowerCase() === activeMentee.menteeName.trim().toLowerCase()
            )
          : [];
        const activeMenteeCleanPhone = activeMentee ? (activeMentee.phone || '').replace(/\D/g, '') : '';
        const activeMenteeVisuals = activeMentee
          ? resolveMenteeVisuals(
              {
                entrepreneurName: activeMentee.menteeName,
                businessName: activeMentee.businessName,
                category: activeMentee.category
              },
              businesses
            )
          : null;

        return (
          <div key="mentees" className="space-y-4 animate-dashboard-tab">
            {/* Toolbar Header + View Toggle */}
            <div className={`p-4 sm:p-5 rounded-2xl border backdrop-blur-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${mentorTheme.surfaceClass}`}>
              <div className="flex items-center gap-2.5">
                <Users className={`w-5 h-5 shrink-0 ${mentorTheme.accentTextClass}`} />
                <div>
                  <h3 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-[#F1F5F9] tracking-tight">
                    {!isEn ? 'Senarai Belia Bimbingan' : 'Assigned Youth'} ({filteredMentees.length})
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                    {!isEn
                      ? 'Pilih usahawan untuk memaparkan profil perniagaan, skor geran dan sejarah catatan sesi.'
                      : 'Select an entrepreneur to view business profile, grant readiness, and session logs.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                  className={`px-3.5 py-2 rounded-xl text-sm cursor-pointer ${mentorTheme.inputClass}`}
                >
                  <option value="all">{!isEn ? 'Semua Daerah' : 'All Districts'}</option>
                  {uniqueMentorDistricts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                {/* List / Card View Toggle */}
                <div className={`inline-flex items-center p-1 rounded-xl border ${mentorTheme.surfaceMutedClass} ${mentorTheme.dividerClass}`}>
                  <button
                    type="button"
                    onClick={() => setMenteeViewMode('list')}
                    aria-label="Paparan Senarai"
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                      menteeViewMode === 'list'
                        ? mentorTheme.segmentedActiveClass
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Senarai</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMenteeViewMode('cards')}
                    aria-label="Paparan Kad"
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                      menteeViewMode === 'cards'
                        ? mentorTheme.segmentedActiveClass
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Kad</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Split-Pane Layout: Left Mentee Directory (50%) | Right Side Profile Panel (50%) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
              {/* Left Pane */}
              <div className="min-w-0">
                {filteredMentees.length === 0 ? (
                  <div className={`rounded-2xl border backdrop-blur-xs py-12 px-4 text-center space-y-3 ${mentorTheme.surfaceClass}`}>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {!isEn ? 'Tiada belia sepadan dengan carian anda.' : 'No youth match your search.'}
                    </p>
                    {(menteeSearch || menteeDistrictFilter !== 'all') && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenteeSearch('');
                          setMenteeDistrictFilter('all');
                        }}
                        className={`px-4 py-2 text-sm font-semibold cursor-pointer ${mentorTheme.secondaryButtonClass}`}
                      >
                        {!isEn ? 'Set Semula' : 'Reset'}
                      </button>
                    )}
                  </div>
                ) : menteeViewMode === 'list' ? (
                  <div className={`rounded-2xl border backdrop-blur-xs overflow-hidden divide-y ${mentorTheme.surfaceClass} ${mentorTheme.dividerClass}`}>
                    {filteredMentees.map((m) => {
                      const isSelected = activeMentee?.key === m.key;
                      const checkScore = getCheckScore(m.key);
                      const visuals = resolveMenteeVisuals(
                        {
                          entrepreneurName: m.menteeName,
                          businessName: m.businessName,
                          category: m.category
                        },
                        businesses
                      );
                      const journeyStages = [
                        { label: !isEn ? 'Sesi' : 'Session', done: m.completedSessions > 0 },
                        { label: !isEn ? 'Catatan' : 'Notes', done: m.totalLogs > 0 },
                        { label: !isEn ? 'Geran' : 'Grant', done: checkScore === 4 },
                        { label: !isEn ? 'Sokongan' : 'Endorsed', done: m.hasEndorsement }
                      ];

                      return (
                        <button
                          key={m.key}
                          type="button"
                          onClick={() => setSelectedMenteeKey(m.key)}
                          className={`w-full text-left p-4 sm:px-5 flex items-start gap-3.5 transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#1D4ED8]/10 dark:bg-[#3B82F6]/18'
                              : mentorTheme.rowHoverClass
                          }`}
                        >
                          <div className={`w-12 h-12 rounded-xl overflow-hidden border shrink-0 bg-slate-100 dark:bg-slate-800 ${mentorTheme.dividerClass}`}>
                            <PortalImage
                              src={visuals.businessUrl}
                              alt={m.businessName}
                              fallbackType="business"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="min-w-0">
                                <span className={`text-sm font-bold truncate block ${isSelected ? mentorTheme.accentTextClass : 'text-slate-900 dark:text-[#F1F5F9]'}`}>
                                  {m.menteeName}
                                </span>
                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 truncate block">
                                  {m.businessName} &middot; {m.district}
                                </span>
                              </div>
                              {m.hasEndorsement ? (
                                <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 shrink-0">
                                  Disokong
                                </span>
                              ) : checkScore === 4 ? (
                                <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold shrink-0 border ${mentorTheme.activeNavClass}`}>
                                  Layak Penuh
                                </span>
                              ) : (
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                                  {m.completedSessions > 0 ? `${m.completedSessions} Sesi` : 'Belum Bermula'}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                              {journeyStages.map((stage) => (
                                <span
                                  key={stage.label}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold ${
                                    stage.done
                                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800/80 dark:text-slate-400'
                                  }`}
                                >
                                  {stage.done && <CheckCircle2 className="w-3 h-3 shrink-0" />}
                                  <span>{stage.label}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredMentees.map((m) => {
                      const isSelected = activeMentee?.key === m.key;
                      const checkScore = getCheckScore(m.key);
                      const visuals = resolveMenteeVisuals(
                        {
                          entrepreneurName: m.menteeName,
                          businessName: m.businessName,
                          category: m.category
                        },
                        businesses
                      );
                      const completedStages = [
                        m.completedSessions > 0,
                        m.totalLogs > 0,
                        checkScore === 4,
                        m.hasEndorsement
                      ].filter(Boolean).length;

                      return (
                        <button
                          key={m.key}
                          type="button"
                          onClick={() => setSelectedMenteeKey(m.key)}
                          className={`text-left rounded-2xl border backdrop-blur-xs p-4 space-y-3 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#1D4ED8]/10 dark:bg-[#3B82F6]/18 border-[#1D4ED8]/45 dark:border-[#60A5FA]/50'
                              : `${mentorTheme.surfaceClass} ${mentorTheme.rowHoverClass}`
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-12 h-12 rounded-xl overflow-hidden border shrink-0 bg-slate-100 dark:bg-slate-800 ${mentorTheme.dividerClass}`}>
                              <PortalImage
                                src={visuals.businessUrl}
                                alt={m.businessName}
                                fallbackType="business"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-slate-900 dark:text-[#F1F5F9] truncate">
                                {m.menteeName}
                              </p>
                              <p className={`text-xs font-semibold truncate ${mentorTheme.accentTextClass}`}>
                                {m.businessName}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {m.district} &middot; {m.category}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                              <span>Kemajuan Bimbingan</span>
                              <span className="tabular-nums">
                                {completedStages > 0 ? `${completedStages} Tahap Selesai` : 'Belum Bermula'}
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700/70 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${mentorTheme.progressFillClass}`}
                                style={{ width: `${Math.round((completedStages / 4) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Pane: Side Mentee Profile & History Panel */}
              <div className={`rounded-2xl border backdrop-blur-xs overflow-hidden ${mentorTheme.surfaceClass}`}>
                {!activeMentee ? (
                  <div className="py-16 px-6 text-center space-y-2">
                    <Users className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto opacity-50" />
                    <p className="text-sm font-semibold text-slate-900 dark:text-[#F1F5F9]">
                      Tiada belia dipilih
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className={`p-5 border-b flex items-start gap-3.5 ${mentorTheme.surfaceMutedClass} ${mentorTheme.dividerClass}`}>
                      {activeMenteeVisuals && (
                        <div className={`w-14 h-14 rounded-2xl overflow-hidden border shrink-0 bg-white dark:bg-slate-900 ${mentorTheme.dividerClass}`}>
                          <PortalImage
                            src={activeMenteeVisuals.businessUrl}
                            alt={activeMentee.businessName}
                            fallbackType="business"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1 space-y-1">
                        <h4 className="font-display text-base font-bold text-slate-900 dark:text-[#F1F5F9] truncate">
                          {activeMentee.menteeName}
                        </h4>
                        <p className={`text-sm font-semibold truncate ${mentorTheme.accentTextClass}`}>
                          {activeMentee.businessName}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-slate-600 dark:text-slate-400">
                          <span>{activeMentee.district}</span>
                          <span>&middot;</span>
                          <span>
                            {activeMentee.ssmNumber ? (
                              <>
                                <span className="kbelia-acro">SSM</span>:{' '}
                                <MiddleTruncate text={activeMentee.ssmNumber} startChars={9} endChars={5} />
                              </>
                            ) : (
                              <>
                                Tiada <span className="kbelia-acro">SSM</span>
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      {/* Quick Metrics */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className={`p-3 rounded-xl border ${mentorTheme.surfaceMutedClass} ${mentorTheme.dividerClass}`}>
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                            Sesi Selesai
                          </span>
                          <span className="font-display text-lg font-bold text-slate-900 dark:text-[#F1F5F9] tabular-nums">
                            {activeMentee.completedSessions > 0 ? `${activeMentee.completedSessions} Sesi` : 'Belum Ada Sesi'}
                          </span>
                        </div>
                        <div className={`p-3 rounded-xl border ${mentorTheme.surfaceMutedClass} ${mentorTheme.dividerClass}`}>
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                            Skor Kelayakan Geran
                          </span>
                          <span className={`font-display text-lg font-bold tabular-nums ${activeMenteeScore === 4 ? 'text-emerald-600 dark:text-emerald-400' : mentorTheme.accentTextClass}`}>
                            {activeMenteeScore !== null
                              ? activeMenteeScore === 4
                                ? 'Layak Penuh'
                                : `${activeMenteeScore} Kriteria`
                              : 'Belum Disemak'}
                          </span>
                        </div>
                      </div>

                      {/* Recent Session Logbook History */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Rekod Sesi Terkini ({activeMenteeLogs.length})
                          </span>
                          <button
                            type="button"
                            onClick={() => openCreateLogForMentee(activeMentee.menteeName, activeMentee.businessName)}
                            className={`text-xs font-semibold hover:underline cursor-pointer ${mentorTheme.accentTextClass}`}
                          >
                            + Tambah Rekod
                          </button>
                        </div>

                        {activeMenteeLogs.length === 0 ? (
                          <div className={`p-3.5 rounded-xl border text-xs text-slate-500 dark:text-slate-400 ${mentorTheme.surfaceMutedClass} ${mentorTheme.dividerClass}`}>
                            Belum ada minit rekod sesi bagi usahawan ini.
                          </div>
                        ) : (
                          <div className={`divide-y rounded-xl border overflow-hidden ${mentorTheme.dividerClass}`}>
                            {activeMenteeLogs.slice(0, 4).map((log) => (
                              <button
                                key={log.id}
                                type="button"
                                onClick={() => {
                                  setSelectedLogId(log.id);
                                  handleSubTabChange('logbook');
                                }}
                                className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-2 transition-colors cursor-pointer ${mentorTheme.rowHoverClass}`}
                              >
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-slate-900 dark:text-[#F1F5F9] truncate">
                                    {log.topic}
                                  </p>
                                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                                    {log.sessionDate}
                                  </p>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className={`pt-3 border-t flex flex-wrap items-center gap-2 ${mentorTheme.dividerClass}`}>
                        {activeMenteeCleanPhone && (
                          <a
                            href={`https://wa.me/${activeMenteeCleanPhone}?text=${encodeURIComponent(`Salam ${activeMentee.menteeName}, saya mentor anda dari KBelia.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`px-3.5 py-2 text-xs font-semibold inline-flex items-center gap-1.5 ${mentorTheme.secondaryButtonClass}`}
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => openCreateLogForMentee(activeMentee.menteeName, activeMentee.businessName)}
                          className={`px-3.5 py-2 text-xs font-semibold inline-flex items-center gap-1.5 ${mentorTheme.secondaryButtonClass}`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Rekod Sesi</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCheckMenteeKey(activeMentee.key);
                            handleSubTabChange('readiness');
                          }}
                          className={`px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5 ml-auto ${mentorTheme.primaryButtonClass}`}
                        >
                          <ClipboardCheck className="w-3.5 h-3.5" />
                          <span>Semak Geran</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
      {/* TAB 1C: SEMAK GERAN (DONUT RINGKASAN + GMAIL TABS + SPLIT PANE)       */}
      {/* ===================================================================== */}
      {currentSubTab === 'readiness' && (() => {
        const getMenteeReadinessStatus = (m: (typeof menteeDirectory)[number]) => {
          const saved = grantChecks.find(
            (c) => c.mentorId === currentMentor.id && c.menteeKey === m.key
          );
          const score = saved
            ? [saved.hasSsm, saved.hasSalesRecord, saved.attendedSession, saved.productReady].filter(Boolean).length
            : null;
          return {
            score,
            isEndorsed: m.hasEndorsement,
            isReady: !m.hasEndorsement && score === 4,
            isIncomplete: !m.hasEndorsement && score !== 4
          };
        };

        const readinessStats = menteeDirectory.reduce(
          (acc, m) => {
            const st = getMenteeReadinessStatus(m);
            if (st.isEndorsed) acc.endorsed += 1;
            else if (st.score === 4) acc.ready += 1;
            else if (st.score !== null) acc.inProgress += 1;
            else acc.unreviewed += 1;
            return acc;
          },
          { ready: 0, inProgress: 0, endorsed: 0, unreviewed: 0 }
        );

        const filteredCheckList = menteeDirectory.filter((m) => {
          const st = getMenteeReadinessStatus(m);
          if (readinessFilterTab === 'ready' && !st.isReady) return false;
          if (readinessFilterTab === 'incomplete' && !st.isIncomplete) return false;
          if (readinessFilterTab === 'endorsed' && !st.isEndorsed) return false;
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
              : 'Sijil pendaftaran perniagaan SSM aktif dan sah.'
          },
          {
            key: 'hasSalesRecord',
            title: '2. Ada rekod jualan harian',
            hint: 'Buku tunai, penyata bank atau lejar aliran tunai 1–3 bulan.'
          },
          {
            key: 'attendedSession',
            title: '3. Pernah hadir sesi bimbingan',
            hint: activeCheckMentee
              ? `${activeCheckMentee.completedSessions > 0 ? `${activeCheckMentee.completedSessions} sesi selesai` : 'Belum ada sesi'} · ${activeCheckMentee.totalLogs > 0 ? `${activeCheckMentee.totalLogs} catatan` : 'Tiada catatan'}`
              : 'Sekurang-kurangnya 1 sesi bimbingan disempurnakan.'
          },
          {
            key: 'productReady',
            title: '4. Produk atau servis siap dijual',
            hint: 'Pembungkusan asas, harga jualan jelas dan sedia untuk pasaran.'
          }
        ];

        const readyCount = [
          draftGrantCheck.hasSsm,
          draftGrantCheck.hasSalesRecord,
          draftGrantCheck.attendedSession,
          draftGrantCheck.productReady
        ].filter(Boolean).length;

        const isFullyReady = readyCount === 4;
        const readinessPercent = Math.round((readyCount / 4) * 100);

        const readinessSegments = [
          { name: 'Layak Penuh', value: readinessStats.ready, color: mentorTheme.chartPrimary, secondaryLabel: readinessStats.ready > 0 ? `${readinessStats.ready} belia` : 'Tiada' },
          { name: 'Dalam Semakan', value: readinessStats.inProgress, color: '#D97706', secondaryLabel: readinessStats.inProgress > 0 ? `${readinessStats.inProgress} belia` : 'Tiada' },
          { name: 'Sudah Disokong', value: readinessStats.endorsed, color: mentorTheme.chartSecondary, secondaryLabel: readinessStats.endorsed > 0 ? `${readinessStats.endorsed} belia` : 'Tiada' },
          { name: 'Belum Disemak', value: readinessStats.unreviewed, color: '#94A3B8', secondaryLabel: readinessStats.unreviewed > 0 ? `${readinessStats.unreviewed} belia` : 'Tiada' }
        ];

        const filterTabs: { id: 'all' | 'ready' | 'incomplete' | 'endorsed'; label: string; count: number }[] = [
          { id: 'all', label: 'Semua', count: menteeDirectory.length },
          { id: 'ready', label: 'Layak Penuh', count: readinessStats.ready },
          { id: 'incomplete', label: 'Belum Lengkap', count: readinessStats.inProgress + readinessStats.unreviewed },
          { id: 'endorsed', label: 'Sudah Disokong', count: readinessStats.endorsed }
        ];

        return (
          <div key="readiness" className="space-y-4 animate-dashboard-tab">
            {/* Top Summary Strip (55%) + Readiness Donut Chart (45%) */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,55fr)_minmax(0,45fr)] gap-4 items-stretch">
              <div className={`rounded-2xl border backdrop-blur-xs p-5 flex flex-col justify-between gap-4 ${mentorTheme.surfaceClass}`}>
                <div className="flex items-center gap-2.5">
                  <ClipboardCheck className={`w-5 h-5 shrink-0 ${mentorTheme.accentTextClass}`} />
                  <div>
                    <h3 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-[#F1F5F9] tracking-tight">
                      Semak Kelayakan Asas Geran
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      Penilaian 4 syarat teras sebelum pengeluaran Surat Sokongan Geran KBelia.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className={`p-3.5 rounded-xl border ${mentorTheme.surfaceMutedClass} ${mentorTheme.dividerClass}`}>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400 block">Jumlah Belia</span>
                    <span className="font-display text-2xl font-bold text-slate-900 dark:text-[#F1F5F9] tabular-nums mt-0.5 block">
                      {menteeDirectory.length}
                    </span>
                  </div>
                  <div className={`p-3.5 rounded-xl border ${mentorTheme.surfaceMutedClass} ${mentorTheme.dividerClass}`}>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400 block">Layak Penuh</span>
                    <span className={`font-display text-2xl font-bold tabular-nums mt-0.5 block ${mentorTheme.accentTextClass}`}>
                      {readinessStats.ready}
                    </span>
                  </div>
                  <div className={`p-3.5 rounded-xl border ${mentorTheme.surfaceMutedClass} ${mentorTheme.dividerClass}`}>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400 block">Belum Lengkap</span>
                    <span className="font-display text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums mt-0.5 block">
                      {readinessStats.inProgress + readinessStats.unreviewed}
                    </span>
                  </div>
                  <div className={`p-3.5 rounded-xl border ${mentorTheme.surfaceMutedClass} ${mentorTheme.dividerClass}`}>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400 block">Sudah Disokong</span>
                    <span className="font-display text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5 block">
                      {readinessStats.endorsed}
                    </span>
                  </div>
                </div>
              </div>

              <RoleDonutCard
                className="h-full"
                role="mentor"
                title="Status Kesiapsiagaan"
                icon={Award}
                segments={readinessSegments}
                centerValue={menteeDirectory.length}
                centerLabel="Belia"
                valueUnit="orang"
                summaryPairs={[
                  { label: 'Layak Penuh', value: readinessStats.ready > 0 ? `${readinessStats.ready} Belia` : 'Tiada', dotColor: mentorTheme.chartPrimary },
                  { label: 'Disokong', value: readinessStats.endorsed > 0 ? `${readinessStats.endorsed} Belia` : 'Tiada', dotColor: mentorTheme.chartSecondary }
                ]}
                emptyState={{
                  title: 'Belum Ada Belia',
                  description: 'Senarai kelayakan akan dipaparkan apabila sesi belia direkodkan.'
                }}
              />
            </div>

            {menteeDirectory.length === 0 ? (
              <div className={`rounded-2xl border backdrop-blur-xs p-8 text-center space-y-3 ${mentorTheme.surfaceClass}`}>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Belum ada rekod belia untuk disemak.
                </p>
                <button
                  type="button"
                  onClick={() => handleSubTabChange('sessions')}
                  className={`px-4 py-2 text-sm font-semibold cursor-pointer ${mentorTheme.primaryButtonClass}`}
                >
                  Lihat Sesi
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
                {/* Senarai Mentee Kiri (50%) */}
                <div className={`rounded-2xl border backdrop-blur-xs overflow-hidden flex flex-col ${mentorTheme.surfaceClass}`}>
                  <div className={`px-3 pt-2 border-b flex items-center gap-3 overflow-x-auto ${mentorTheme.dividerClass}`}>
                    {filterTabs.map((tab) => {
                      const active = readinessFilterTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setReadinessFilterTab(tab.id)}
                          className={`py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap shrink-0 cursor-pointer ${
                            active ? mentorTheme.tabActiveUnderlineClass : mentorTheme.tabIdleUnderlineClass
                          }`}
                        >
                          {tab.label} ({tab.count})
                        </button>
                      );
                    })}
                  </div>
                  <div className={`p-3 border-b ${mentorTheme.dividerClass}`}>
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={readinessSearch}
                        onChange={(e) => setReadinessSearch(e.target.value)}
                        placeholder="Cari nama atau bisnes..."
                        className={`w-full pl-9 pr-3 py-2 rounded-xl text-sm ${mentorTheme.inputClass}`}
                      />
                    </div>
                  </div>
                  <div className={`divide-y max-h-[460px] overflow-y-auto ${mentorTheme.dividerClass}`}>
                    {filteredCheckList.length === 0 ? (
                      <div className="py-8 px-4 text-center text-xs text-slate-600 dark:text-slate-400">
                        Tiada belia dalam kategori ini.
                      </div>
                    ) : (
                      filteredCheckList.map((m) => {
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
                                ? 'bg-[#1D4ED8]/10 dark:bg-[#3B82F6]/15 font-semibold'
                                : mentorTheme.rowHoverClass
                            }`}
                          >
                            <div className="min-w-0">
                              <p className={`text-sm font-semibold truncate ${isSelected ? mentorTheme.accentStrongTextClass : 'text-slate-900 dark:text-[#F1F5F9]'}`}>
                                {m.menteeName}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                                {m.businessName}
                              </p>
                            </div>
                            <span className={`text-xs font-semibold shrink-0 tabular-nums ${
                              m.hasEndorsement
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : score === 4
                                ? mentorTheme.accentTextClass
                                : score !== null
                                ? 'text-amber-700 dark:text-amber-400'
                                : 'text-slate-500 dark:text-slate-400'
                            }`}>
                              {m.hasEndorsement
                                ? 'Disokong'
                                : score !== null
                                ? score === 4
                                  ? 'Layak Penuh'
                                  : `${score} Kriteria`
                                : 'Baru'}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Borang 4 Tandaan Kanan (50%) */}
                {activeCheckMentee && (
                  <div className={`rounded-2xl border backdrop-blur-xs overflow-hidden ${mentorTheme.surfaceClass}`}>
                    <div className={`p-4 sm:p-5 border-b space-y-3 ${mentorTheme.surfaceMutedClass} ${mentorTheme.dividerClass}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="font-display text-base font-bold text-slate-900 dark:text-[#F1F5F9]">
                            {activeCheckMentee.menteeName}
                          </h4>
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                            {activeCheckMentee.businessName} &middot; {activeCheckMentee.district}
                          </p>
                        </div>
                        <span className={`text-sm font-bold tabular-nums ${
                          isFullyReady
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-amber-700 dark:text-amber-400'
                        }`}>
                          {readinessPercent}% &middot; {isFullyReady ? 'Layak Disokong' : 'Belum Lengkap'}
                        </span>
                      </div>

                      {/* Linear Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700/70 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-[width] duration-300 ${
                              isFullyReady ? 'bg-emerald-600 dark:bg-emerald-400' : mentorTheme.progressFillClass
                            }`}
                            style={{ width: `${readinessPercent}%` }}
                          />
                        </div>
                        <div
                          className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                            isFullyReady
                              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-300'
                              : 'bg-amber-50/80 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800/60 dark:text-amber-300'
                          }`}
                        >
                          {isFullyReady ? (
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 shrink-0" />
                          )}
                          <span>
                            {isFullyReady
                              ? 'Semua 4 kriteria asas telah dipenuhi. Usahawan ini sedia untuk menerima Surat Sokongan Geran Rasmi.'
                              : `Lengkapkan baki ${4 - readyCount} kriteria asas lagi sebelum mengesyorkan surat sokongan geran penuh.`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={`divide-y ${mentorTheme.dividerClass}`}>
                      {checklistItems.map((item) => {
                        const checked = draftGrantCheck[item.key];
                        return (
                          <div
                            key={item.key}
                            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="min-w-0 space-y-1">
                              <p className="text-sm font-semibold text-slate-900 dark:text-[#F1F5F9]">
                                {item.title}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                {item.hint}
                              </p>
                            </div>
                            <div className={`inline-flex items-center p-1 rounded-xl border shrink-0 self-start sm:self-center ${mentorTheme.surfaceMutedClass} ${mentorTheme.dividerClass}`}>
                              <button
                                type="button"
                                onClick={() =>
                                  setDraftGrantCheck((prev) => ({ ...prev, [item.key]: true }))
                                }
                                className={`px-3.5 py-1 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                                  checked
                                    ? mentorTheme.segmentedActiveClass
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-[#F1F5F9]'
                                }`}
                              >
                                Ya
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDraftGrantCheck((prev) => ({ ...prev, [item.key]: false }))
                                }
                                className={`px-3.5 py-1 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                                  !checked
                                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-[#F1F5F9]'
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
                        <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
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
                          className={`px-4 py-2 text-sm font-semibold cursor-pointer ${mentorTheme.secondaryButtonClass}`}
                        >
                          Simpan Semakan
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            saveMenteeGrantCheck(true);
                            const summaryText = `Semakan Mentor (${readinessPercent}%): ${
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
                          className={`px-4 py-2 text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer ${mentorTheme.primaryButtonClass}`}
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
      {/* TAB 2: SOKONGAN RASMI USAHAWAN BELIA (SPLIT-PANE LIVE LETTER PREVIEW) */}
      {/* ===================================================================== */}
      {currentSubTab === 'endorsements' && (() => {
        const activeEndorsements = mentorEndorsements.filter((e) => e.status === 'active');
        const totalRecommendedValue = activeEndorsements.reduce(
          (sum, e) => sum + parseNumericAmount(e.recommendedAmount),
          0
        );
        const count3k = activeEndorsements.filter((e) => e.recommendedAmount === 'RM3,000').length;
        const count5k10k = activeEndorsements.filter(
          (e) => e.recommendedAmount === 'RM5,000' || e.recommendedAmount === 'RM10,000'
        ).length;

        const activeEndorsement =
          filteredEndorsements.find((e) => e.id === selectedEndorsementId) ||
          filteredEndorsements[0] ||
          null;

        const tierTabs: { id: 'all' | 'RM3,000' | 'RM5,000' | 'RM10,000'; label: string }[] = [
          { id: 'all', label: 'Semua Tahap' },
          { id: 'RM3,000', label: 'RM3,000 (Permulaan)' },
          { id: 'RM5,000', label: 'RM5,000 (Pemangkin)' },
          { id: 'RM10,000', label: 'RM10,000 (Skala)' }
        ];

        return (
          <div key="endorsements" className="space-y-4 animate-dashboard-tab">
            {/* Tier Summary KPI Strip */}
            <div className={`grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x rounded-2xl border backdrop-blur-xs ${mentorTheme.surfaceClass} ${mentorTheme.dividerClass}`}>
              <div className="p-4 sm:p-5">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
                  Surat Perakuan Aktif
                </span>
                <span className="font-display text-2xl font-bold text-slate-900 dark:text-[#F1F5F9] mt-1 tabular-nums block">
                  {activeEndorsements.length}
                </span>
              </div>
              <div className="p-4 sm:p-5">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
                  Jumlah Nilai Disyor
                </span>
                <span className={`font-display text-2xl font-bold mt-1 tabular-nums block ${mentorTheme.accentTextClass}`}>
                  RM {totalRecommendedValue.toLocaleString('ms-MY')}
                </span>
              </div>
              <div className="p-4 sm:p-5">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
                  Geran Permulaan (RM3,000)
                </span>
                <span className="font-display text-2xl font-bold text-slate-900 dark:text-[#F1F5F9] mt-1 tabular-nums block">
                  {count3k}
                </span>
              </div>
              <div className="p-4 sm:p-5">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
                  Pemangkin &amp; Skala
                </span>
                <span className="font-display text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums block">
                  {count5k10k}
                </span>
              </div>
            </div>

            {/* Header + Tier Tabs + Add Button */}
            <div className={`rounded-2xl border backdrop-blur-xs overflow-hidden ${mentorTheme.surfaceClass}`}>
              <div className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Award className={`w-5 h-5 shrink-0 ${mentorTheme.accentTextClass}`} />
                  <div>
                    <h3 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-[#F1F5F9] tracking-tight">
                      Sokongan &amp; Perakuan Geran Usahawan
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      Pilih rekod di kiri untuk menyemak surat rasmi berkod pengesahan secara langsung di kanan.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsNewEndorsementModalOpen(true)}
                  className={`px-4 py-2 text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 shrink-0 ${mentorTheme.primaryButtonClass}`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Perakuan</span>
                </button>
              </div>

              <div className={`px-4 sm:px-5 border-t flex items-center justify-between flex-wrap gap-3 ${mentorTheme.dividerClass}`}>
                <div className="flex items-center gap-5 overflow-x-auto">
                  {tierTabs.map((tab) => {
                    const isTabActive = endorsementsGrantFilter === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setEndorsementsGrantFilter(tab.id)}
                        className={`py-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          isTabActive
                            ? mentorTheme.tabActiveUnderlineClass
                            : mentorTheme.tabIdleUnderlineClass
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div className="relative py-2">
                  <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={endorsementsSearch}
                    onChange={(e) => setEndorsementsSearch(e.target.value)}
                    placeholder="Cari usahawan, kod atau daerah..."
                    className={`pl-9 pr-3 py-1.5 rounded-xl text-xs sm:text-sm w-52 sm:w-64 ${mentorTheme.inputClass}`}
                  />
                </div>
              </div>
            </div>

            {/* Split-Pane Layout: Left List (45%) | Right Live Letter Preview (55%) */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,45fr)_minmax(0,55fr)] gap-4 items-stretch">
              {/* Left Pane */}
              <div className={`rounded-2xl border backdrop-blur-xs overflow-hidden flex flex-col ${mentorTheme.surfaceClass}`}>
                {filteredEndorsements.length === 0 ? (
                  <div className="py-12 px-4 text-center space-y-2">
                    <FileCheck className="w-9 h-9 text-slate-400 dark:text-slate-500 mx-auto opacity-50" />
                    <p className="text-sm font-semibold text-slate-900 dark:text-[#F1F5F9]">
                      Tiada surat perakuan ditemui.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className={`divide-y ${mentorTheme.dividerClass}`}>
                      {endorsementsPagination.paginatedItems.map((item) => {
                        const isSelected = activeEndorsement?.id === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setSelectedEndorsementId(item.id)}
                            className={`w-full text-left p-3.5 sm:px-4 flex items-start gap-3 transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#1D4ED8]/10 dark:bg-[#3B82F6]/15'
                                : mentorTheme.rowHoverClass
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${mentorTheme.surfaceMutedClass} ${mentorTheme.dividerClass} ${mentorTheme.accentTextClass}`}>
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`text-sm font-bold truncate ${isSelected ? mentorTheme.accentStrongTextClass : 'text-slate-900 dark:text-[#F1F5F9]'}`}>
                                  {item.menteeName}
                                </span>
                                <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold tabular-nums shrink-0 ${mentorTheme.activeNavClass}`}>
                                  {item.recommendedAmount}
                                </span>
                              </div>
                              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate">
                                {item.businessName} &middot; {item.district}
                              </p>
                              <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                <MiddleTruncate text={item.endorsementCode} startChars={11} endChars={5} className="truncate" />
                                <span className="tabular-nums shrink-0">{item.issuedAt}</span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <PaginationBar
                      currentPage={endorsementsPagination.currentPage}
                      totalItems={endorsementsPagination.totalItems}
                      itemsPerPage={7}
                      onPageChange={endorsementsPagination.setCurrentPage}
                      itemLabel="perakuan"
                    />
                  </>
                )}
              </div>

              {/* Right Pane: Live Official Letter Preview */}
              <div className={`rounded-2xl border backdrop-blur-xs overflow-hidden ${mentorTheme.surfaceClass}`}>
                {!activeEndorsement ? (
                  <div className="py-16 px-6 text-center space-y-2">
                    <Award className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto opacity-50" />
                    <p className="text-sm font-semibold text-slate-900 dark:text-[#F1F5F9]">
                      Pilih surat perakuan di sebelah kiri untuk pratonton
                    </p>
                  </div>
                ) : (
                  <div>
                    {/* Preview Action Bar */}
                    <div className={`p-3.5 sm:px-5 border-b flex flex-wrap items-center justify-between gap-2 ${mentorTheme.surfaceMutedClass} ${mentorTheme.dividerClass}`}>
                      <MiddleTruncate
                        text={activeEndorsement.endorsementCode}
                        startChars={11}
                        endChars={5}
                        className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-400 truncate"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(activeEndorsement.endorsementCode);
                            showToast(`Kod ${activeEndorsement.endorsementCode} disalin.`);
                          }}
                          className={`px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 ${mentorTheme.secondaryButtonClass}`}
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Kod</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const html = generateMentorEndorsementOfficialHtml(activeEndorsement);
                            void openAndPrintDocument(html, `Perakuan_Geran_${activeEndorsement.endorsementCode}`);
                          }}
                          className={`px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 ${mentorTheme.secondaryButtonClass}`}
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Cetak</span>
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const html = generateMentorEndorsementOfficialHtml(activeEndorsement);
                            const ok = await downloadHtmlAsPdf(html, `Perakuan_Geran_${activeEndorsement.endorsementCode}`);
                            if (ok) {
                              triggerToast('Surat perakuan rasmi berjaya dimuat turun sebagai PDF.', 'success');
                            } else {
                              triggerToast('Gagal menjana PDF surat perakuan.', 'error');
                            }
                          }}
                          className={`px-3.5 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 ${mentorTheme.primaryButtonClass}`}
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedEndorsementForView(activeEndorsement)}
                          className={`px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 ${mentorTheme.secondaryButtonClass}`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Skrin Penuh</span>
                        </button>
                      </div>
                    </div>

                    {/* Crisp Paper Letter Preview */}
                    <div className={`p-4 sm:p-5 ${mentorTheme.surfaceMutedClass}`}>
                      <div className="max-w-xl mx-auto bg-white text-slate-900 rounded-xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-2xs">
                        <div className="text-center pb-3 border-b-2 border-slate-900 space-y-1">
                          <p className="text-[11px] font-bold uppercase tracking-widest text-[#1D4ED8]">
                            HAB PEMBANGUNAN USAHAWAN BELIA KELANTAN (<span className="kbelia-acro">KBELIA</span>)
                          </p>
                          <h4 className="font-display text-sm sm:text-base font-black uppercase tracking-tight text-slate-900">
                            SURAT PERAKUAN SOKONGAN MENTOR
                          </h4>
                          <p className="text-xs text-slate-600">
                            Panel Bimbingan Mentor &amp; Keusahawanan Negeri Kelantan
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-700">
                          <span>Ruj: <MiddleTruncate text={activeEndorsement.endorsementCode} startChars={11} endChars={5} className="font-bold text-slate-900" /></span>
                          <span>Tarikh: <strong className="text-slate-900">{activeEndorsement.issuedAt}</strong></span>
                        </div>

                        <div className="p-3 rounded-lg bg-[#EFF6FF] border border-[#1D4ED8]/20 text-center">
                          <p className="text-xs font-bold uppercase text-[#1D4ED8]">
                            {activeEndorsement.grantProgramTitle}
                          </p>
                          <p className="font-display text-base font-black text-slate-900 mt-0.5 tabular-nums">
                            {activeEndorsement.recommendedAmount}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                          <div>
                            <span className="text-slate-500 block">Nama Usahawan</span>
                            <strong className="text-slate-900">{activeEndorsement.menteeName}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Nama Perniagaan</span>
                            <strong className="text-slate-900">{activeEndorsement.businessName}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Kategori Sektor</span>
                            <strong className="text-slate-900">{activeEndorsement.businessCategory}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Daerah Operasi</span>
                            <strong className="text-slate-900">{activeEndorsement.district}</strong>
                          </div>
                        </div>

                        <div className="space-y-1 text-xs sm:text-sm">
                          <span className="font-bold text-slate-900 block">Ulasan Justifikasi Mentor:</span>
                          <p className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 italic leading-relaxed kbelia-prose">
                            &ldquo;<AcronymText text={activeEndorsement.justification} />&rdquo;
                          </p>
                        </div>

                        <div className="space-y-1 text-xs sm:text-sm">
                          <span className="font-bold text-slate-900 block">Tahap Kesediaan Operasi:</span>
                          <p className="text-slate-700 leading-relaxed kbelia-prose">
                            <AcronymText text={activeEndorsement.businessReadinessRemark} />
                          </p>
                        </div>

                        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-xs">
                          <div>
                            <div className="font-serif italic text-sm font-bold text-slate-900 border-b border-slate-400 pb-1 mb-1 inline-block min-w-28">
                              {activeEndorsement.mentorName
                                .replace(/^(Prof\.|Madya|Dr\.|Ts\.|En\.|Puan|Hj\.|Hjh\.)\s*/gi, '')
                                .trim()
                                .split(/\s+/)
                                .slice(0, 2)
                                .join(' ') || activeEndorsement.mentorName}
                            </div>
                            <strong className="block text-slate-900">{activeEndorsement.mentorName}</strong>
                            <span className="text-slate-600 block">{activeEndorsement.mentorDesignation || 'Mentor'}</span>
                            <span className="text-slate-500 block">{activeEndorsement.mentorAgency}</span>
                          </div>

                          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900">
                            <QrCodeGraphic
                              value={buildVerificationQrPayload(activeEndorsement.endorsementCode)}
                              size={74}
                            />
                            <div>
                              <span className="font-bold uppercase tracking-wide block text-[11px] text-[#1E3A8A]">
                                SAH DIPERAKUKAN
                              </span>
                              <MiddleTruncate
                                text={activeEndorsement.endorsementCode}
                                startChars={11}
                                endChars={5}
                                className="font-mono text-[10.5px] block font-semibold"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ===================================================================== */}
      {/* TAB 3: REKOD SESI & TUGASAN (SPLIT-PANE + TEMPLAT PANTAS)             */}
      {/* ===================================================================== */}
      {currentSubTab === 'logbook' && (() => {
        const allLogTasks = mentorLogs.flatMap((l) => l.actionItems || []);
        const doneLogTasks = allLogTasks.filter((t) => t.completed).length;
        const pendingLogTasks = allLogTasks.length - doneLogTasks;
        const taskCompletionPct =
          allLogTasks.length > 0 ? Math.round((doneLogTasks / allLogTasks.length) * 100) : 0;

        const activeLog =
          filteredLogs.find((l) => l.id === selectedLogId) || filteredLogs[0] || null;

        const logFilterTabs: { id: 'all' | 'pending' | 'done'; label: string; count: number }[] = [
          { id: 'all', label: 'Semua Rekod', count: mentorLogs.length },
          {
            id: 'pending',
            label: 'Masih Berjalan',
            count: mentorLogs.filter((l) => {
              const total = l.actionItems?.length || 0;
              const done = l.actionItems?.filter((a) => a.completed).length || 0;
              return !(total > 0 && done === total);
            }).length
          },
          {
            id: 'done',
            label: 'Selesai',
            count: mentorLogs.filter((l) => {
              const total = l.actionItems?.length || 0;
              const done = l.actionItems?.filter((a) => a.completed).length || 0;
              return total > 0 && done === total;
            }).length
          }
        ];

        return (
          <div key="logbook" className="space-y-4 animate-dashboard-tab">
            {/* 4-Metric KPI Strip */}
            <div className={`grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x rounded-2xl border backdrop-blur-xs ${mentorTheme.surfaceClass} ${mentorTheme.dividerClass}`}>
              <div className="p-4">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
                  Jumlah Rekod Sesi
                </span>
                <p className="font-display text-2xl font-bold text-slate-900 dark:text-[#F1F5F9] mt-1 tabular-nums">
                  {mentorLogs.length}
                </p>
              </div>
              <div className="p-4">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
                  Tugasan Selesai
                </span>
                <p className="font-display text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                  {doneLogTasks}
                </p>
              </div>
              <div className="p-4">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
                  Tugasan Tertunda
                </span>
                <p className="font-display text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
                  {pendingLogTasks}
                </p>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    % Penyelesaian
                  </span>
                  <span className={`font-display text-sm font-bold tabular-nums ${mentorTheme.accentStrongTextClass}`}>
                    {taskCompletionPct}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700/70 overflow-hidden mt-2.5">
                  <div
                    className={`h-full rounded-full transition-[width] duration-500 ${
                      taskCompletionPct === 100 ? 'bg-emerald-600 dark:bg-emerald-400' : mentorTheme.progressFillClass
                    }`}
                    style={{ width: `${taskCompletionPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Template Chips Bar */}
            <div className={`p-3.5 sm:px-5 rounded-2xl border backdrop-blur-xs flex flex-wrap items-center justify-between gap-3 ${mentorTheme.surfaceClass}`}>
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mr-1">
                  Templat Pantas:
                </span>
                {LOGBOOK_QUICK_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => openCreateLogFromTemplate(tpl)}
                    className={`px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${mentorTheme.secondaryButtonClass}`}
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${mentorTheme.accentTextClass}`} />
                    <span>{tpl.label}</span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={openCreateLogModal}
                className={`interactive-press px-4 py-2 font-semibold text-sm flex items-center justify-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap ${mentorTheme.primaryButtonClass}`}
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Rekod</span>
              </button>
            </div>

            {/* Split-Pane Master List (50%) & Document Preview (50%) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
              {/* Left List Pane */}
              <div className={`rounded-2xl border backdrop-blur-xs overflow-hidden flex flex-col ${mentorTheme.surfaceClass}`}>
                {/* Gmail-style underline filter tabs */}
                <div className={`flex items-center gap-1 px-3 pt-2 border-b overflow-x-auto ${mentorTheme.dividerClass}`}>
                  {logFilterTabs.map((tab) => {
                    const isActive = logsStatusFilter === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setLogsStatusFilter(tab.id)}
                        className={`px-3 py-2.5 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                          isActive ? mentorTheme.tabActiveUnderlineClass : mentorTheme.tabIdleUnderlineClass
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span className="text-[11px] font-mono tabular-nums opacity-80">({tab.count})</span>
                      </button>
                    );
                  })}
                </div>

                {/* Search + Sort Bar */}
                <div className={`p-3 border-b flex flex-wrap sm:flex-nowrap items-center gap-2 ${mentorTheme.surfaceMutedClass} ${mentorTheme.dividerClass}`}>
                  <div className="relative flex-1 min-w-[160px]">
                    <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={logsSearch}
                      onChange={(e) => setLogsSearch(e.target.value)}
                      placeholder="Cari usahawan, topik..."
                      className={`w-full pl-9 pr-3 py-1.5 rounded-xl text-sm ${mentorTheme.inputClass}`}
                    />
                  </div>
                  <select
                    value={logsSortPreset === 'table_column' ? '' : logsSortPreset}
                    onChange={(e) => {
                      if (e.target.value) setLogsSortPreset(e.target.value);
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer ${mentorTheme.inputClass}`}
                    aria-label="Susun rekod sesi"
                  >
                    {logsSortOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {filteredLogs.length === 0 ? (
                  <div className="py-12 px-4 text-center text-sm text-slate-600 dark:text-slate-400">
                    Tiada rekod sesi bimbingan untuk tapisan ini.
                  </div>
                ) : (
                  <div className={`divide-y ${mentorTheme.dividerClass}`}>
                    {logsPagination.paginatedItems.map((log) => {
                      const isSelected = activeLog?.id === log.id;
                      const totalTasks = log.actionItems?.length || 0;
                      const doneTasks = log.actionItems?.filter((a) => a.completed).length || 0;
                      const visuals = resolveMenteeVisuals(
                        { entrepreneurName: log.menteeName, businessName: log.businessName },
                        businesses
                      );
                      return (
                        <button
                          key={log.id}
                          type="button"
                          onClick={() => setSelectedLogId(log.id)}
                          className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                            isSelected ? 'bg-[#1D4ED8]/10 dark:bg-[#3B82F6]/15' : mentorTheme.rowHoverClass
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl overflow-hidden border bg-slate-100 dark:bg-slate-800 shrink-0 ${mentorTheme.dividerClass}`}>
                            <PortalImage
                              src={visuals.businessUrl}
                              alt={log.businessName}
                              fallbackType="business"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold text-slate-900 dark:text-[#F1F5F9] truncate">
                                {log.menteeName}
                              </span>
                              <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                                {log.sessionDate}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 line-clamp-2 leading-snug">
                              {log.topic}
                            </p>
                            <div className="flex items-center justify-between gap-2 pt-0.5">
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                {log.businessName}
                              </span>
                              <span
                                className={`text-[11px] font-semibold tabular-nums whitespace-nowrap shrink-0 ${
                                  totalTasks > 0 && doneTasks === totalTasks
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : mentorTheme.accentStrongTextClass
                                }`}
                              >
                                {totalTasks > 0
                                  ? doneTasks === totalTasks
                                    ? `${totalTasks} Tugasan Selesai`
                                    : doneTasks > 0
                                    ? `${doneTasks} Selesai · ${totalTasks - doneTasks} Baki`
                                    : `${totalTasks} Tugasan`
                                  : 'Direkodkan'}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
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

              {/* Right Side Document Preview & Interactive Checklist Panel */}
              <div className={`rounded-2xl border backdrop-blur-xs overflow-hidden ${mentorTheme.surfaceClass}`}>
                {!activeLog ? (
                  <div className="p-10 text-center space-y-3">
                    <FileText className={`w-8 h-8 mx-auto ${mentorTheme.accentTextClass}`} />
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Pilih mana-mana rekod di sebelah kiri atau cipta rekod baharu menggunakan templat pantas.
                    </p>
                    <button
                      type="button"
                      onClick={openCreateLogModal}
                      className={`px-4 py-2 text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer ${mentorTheme.primaryButtonClass}`}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Rekod Baharu</span>
                    </button>
                  </div>
                ) : (() => {
                  const totalTasks = activeLog.actionItems?.length || 0;
                  const doneTasks = activeLog.actionItems?.filter((a) => a.completed).length || 0;
                  const visuals = resolveMenteeVisuals(
                    { entrepreneurName: activeLog.menteeName, businessName: activeLog.businessName },
                    businesses
                  );
                  return (
                    <div>
                      {/* Document Header */}
                      <div className={`p-4 sm:p-5 border-b space-y-3 ${mentorTheme.surfaceMutedClass} ${mentorTheme.dividerClass}`}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-12 h-12 rounded-xl overflow-hidden border bg-slate-100 dark:bg-slate-800 shrink-0 ${mentorTheme.dividerClass}`}>
                              <PortalImage
                                src={visuals.businessUrl}
                                alt={activeLog.businessName}
                                fallbackType="business"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-display text-base font-bold text-slate-900 dark:text-[#F1F5F9] truncate">
                                {activeLog.menteeName}
                              </h4>
                              <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                                {activeLog.businessName} &middot;{' '}
                                <span className="font-mono tabular-nums">{activeLog.sessionDate}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                const html = generateMentorLogbookOfficialHtml({
                                  log: activeLog,
                                  mentorName: currentMentor.name,
                                  mentorAgency: currentMentor.agency,
                                  mentorDesignation: currentMentor.title
                                });
                                void openAndPrintDocument(
                                  html,
                                  `Rekod_Sesi_${activeLog.menteeName.replace(/\s+/g, '_')}`
                                );
                              }}
                              className={`px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap ${mentorTheme.secondaryButtonClass}`}
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Cetak</span>
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                const html = generateMentorLogbookOfficialHtml({
                                  log: activeLog,
                                  mentorName: currentMentor.name,
                                  mentorAgency: currentMentor.agency,
                                  mentorDesignation: currentMentor.title
                                });
                                const ok = await downloadHtmlAsPdf(
                                  html,
                                  `Rekod_Sesi_${activeLog.menteeName.replace(/\s+/g, '_')}`
                                );
                                if (ok) {
                                  triggerToast('Rekod sesi bimbingan berjaya dimuat turun sebagai PDF.', 'success');
                                } else {
                                  triggerToast('Gagal menjana PDF rekod sesi.', 'error');
                                }
                              }}
                              className={`px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap ${mentorTheme.secondaryButtonClass}`}
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>PDF</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditLogModal(activeLog)}
                              className={`px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap ${mentorTheme.secondaryButtonClass}`}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Sunting</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteLogEntry(activeLog)}
                              className={`px-3 py-1.5 text-xs inline-flex items-center gap-1 cursor-pointer whitespace-nowrap ${mentorTheme.dangerOutlineButtonClass}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Padam</span>
                            </button>
                          </div>
                        </div>

                        <div className="pt-1">
                          <span className={`text-xs font-semibold ${mentorTheme.accentTextClass} block`}>
                            Topik Bimbingan
                          </span>
                          <p className="text-sm font-bold text-slate-900 dark:text-[#F1F5F9] mt-0.5">
                            {activeLog.topic}
                          </p>
                        </div>
                      </div>

                      {/* Discussion Minutes */}
                      <div className="p-4 sm:p-5 space-y-5">
                        <div className="space-y-1.5">
                          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                            Ringkasan Perbincangan Sesi
                          </span>
                          <p className="text-[0.9375rem] text-slate-900 dark:text-[#F1F5F9] leading-relaxed font-sans whitespace-pre-line">
                            {activeLog.minutes}
                          </p>
                        </div>

                        {/* Interactive Follow-up Checklist */}
                        <div className={`pt-4 border-t space-y-3 ${mentorTheme.dividerClass}`}>
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <CheckSquare className={`w-4 h-4 ${mentorTheme.accentTextClass}`} />
                              <span className="text-sm font-bold text-slate-900 dark:text-[#F1F5F9]">
                                Senarai Semak Tugasan Susulan
                              </span>
                              <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                                {totalTasks === 0 ? '(Tiada tugasan)' : doneTasks === 0 ? '(Belum selesai)' : `(${doneTasks} selesai)`}
                              </span>
                            </div>

                            {!inlineNewTaskDrafts[activeLog.id]?.isOpen && (
                              <button
                                type="button"
                                onClick={() => handleOpenInlineNewTask(activeLog.id)}
                                className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold cursor-pointer whitespace-nowrap ${mentorTheme.primaryButtonClass}`}
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Tambah Tugasan</span>
                              </button>
                            )}
                          </div>

                          {(!activeLog.actionItems || activeLog.actionItems.length === 0) ? (
                            <div className={`py-3 text-[0.8125rem] text-slate-600 dark:text-slate-400 flex items-center justify-between gap-2 flex-wrap border-t ${mentorTheme.dividerClass}`}>
                              <span>Belum ada tugasan direkodkan untuk sesi ini.</span>
                              {!inlineNewTaskDrafts[activeLog.id]?.isOpen && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenInlineNewTask(activeLog.id)}
                                  className={`font-bold hover:underline cursor-pointer ${mentorTheme.accentTextClass}`}
                                >
                                  + Tambah tugasan pertama
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className={`divide-y ${mentorTheme.dividerClass}`}>
                              {activeLog.actionItems.map((task) => {
                                const isEditingThis =
                                  editingInlineTask?.logId === activeLog.id &&
                                  editingInlineTask?.taskId === task.id;

                                if (isEditingThis && editingInlineTask) {
                                  return (
                                    <div key={task.id} className="py-3 space-y-2.5">
                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                                        <input
                                          type="text"
                                          value={editingInlineTask.task}
                                          onChange={(e) =>
                                            setEditingInlineTask((prev) =>
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
                                            setEditingInlineTask((prev) =>
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
                                          className={`px-3.5 py-1.5 text-xs font-semibold cursor-pointer ${mentorTheme.secondaryButtonClass}`}
                                        >
                                          Batal
                                        </button>
                                        <button
                                          type="button"
                                          onClick={handleSaveInlineTaskEdit}
                                          className={`px-3.5 py-1.5 text-xs font-semibold cursor-pointer ${mentorTheme.primaryButtonClass}`}
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
                                        : 'text-slate-900 dark:text-[#F1F5F9]'
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => handleToggleLogTask(activeLog.id, task.id)}
                                      className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                                    >
                                      <div
                                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                                          task.completed
                                            ? 'bg-[#1D4ED8] border-[#1D4ED8] dark:bg-[#3B82F6] dark:border-[#3B82F6] text-white'
                                            : `border-slate-300 dark:border-slate-600 ${mentorTheme.surfaceClass}`
                                        }`}
                                      >
                                        {task.completed && <Check className="w-3.5 h-3.5" />}
                                      </div>
                                      <span className={`text-sm font-medium break-words ${task.completed ? 'line-through' : ''}`}>
                                        {task.task}
                                      </span>
                                    </button>

                                    <div className="flex items-center gap-2 shrink-0">
                                      <span
                                        className={`text-xs font-mono tabular-nums ${
                                          task.completed
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : 'text-slate-500 dark:text-slate-400'
                                        }`}
                                      >
                                        Sasaran: {task.dueDate}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleStartInlineTaskEdit(activeLog.id, task)}
                                        aria-label={`Sunting tugasan ${task.task}`}
                                        className={`p-1.5 rounded-xl text-slate-500 dark:text-slate-400 transition-colors cursor-pointer ${mentorTheme.rowHoverClass}`}
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteInlineTask(activeLog.id, task.id)}
                                        aria-label={`Padam tugasan ${task.task}`}
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

                          {inlineNewTaskDrafts[activeLog.id]?.isOpen && (
                            <div className={`pt-3 border-t space-y-2.5 ${mentorTheme.dividerClass}`}>
                              <div className="text-xs font-bold text-slate-900 dark:text-[#F1F5F9]">
                                Tambah Tugasan Baharu
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                                <input
                                  type="text"
                                  value={inlineNewTaskDrafts[activeLog.id]?.task || ''}
                                  onChange={(e) =>
                                    setInlineNewTaskDrafts((prev) => ({
                                      ...prev,
                                      [activeLog.id]: {
                                        ...(prev[activeLog.id] || { isOpen: true, dueDate: '' }),
                                        task: e.target.value
                                      }
                                    }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleSaveInlineNewTask(activeLog.id);
                                    } else if (e.key === 'Escape') {
                                      setInlineNewTaskDrafts((prev) => ({
                                        ...prev,
                                        [activeLog.id]: { isOpen: false, task: '', dueDate: '' }
                                      }));
                                    }
                                  }}
                                  placeholder="Masukkan tugasan baharu untuk usahawan"
                                  autoFocus
                                  className={`sm:col-span-2 px-3 py-2 rounded-xl text-sm ${mentorTheme.inputClass}`}
                                />
                                <ModernDatePicker
                                  value={inlineNewTaskDrafts[activeLog.id]?.dueDate || ''}
                                  onChange={(val) =>
                                    setInlineNewTaskDrafts((prev) => ({
                                      ...prev,
                                      [activeLog.id]: {
                                        ...(prev[activeLog.id] || { isOpen: true, task: '' }),
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
                                    setInlineNewTaskDrafts((prev) => ({
                                      ...prev,
                                      [activeLog.id]: { isOpen: false, task: '', dueDate: '' }
                                    }))
                                  }
                                  className={`px-3.5 py-1.5 text-xs font-semibold cursor-pointer ${mentorTheme.secondaryButtonClass}`}
                                >
                                  Batal
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveInlineNewTask(activeLog.id)}
                                  className={`px-3.5 py-1.5 text-xs font-semibold cursor-pointer ${mentorTheme.primaryButtonClass}`}
                                >
                                  Tambah
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ===================================================================== */}
      {/* TAB 3B: LAPORAN RINGKAS MENTOR (DUAL CHARTS + EXCEL/PDF EXPORT)       */}
      {/* ===================================================================== */}
      {currentSubTab === 'impact' && (() => {
        const completedSessionsCount = mentorRegistrations.filter((r) => r.status === 'completed').length;
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

        const SECTOR_PALETTE = ['#2563EB', '#0D9488', '#D97706', '#4F46E5', '#64748B'];
        const sectorSegments = sectorRows.slice(0, 5).map((row, idx) => ({
          name: row.sector,
          value: row.count,
          color: SECTOR_PALETTE[idx % SECTOR_PALETTE.length],
          secondaryLabel: `${row.count} belia`
        }));

        const chartDistrictData = districtRows.slice(0, 8).map((row) => ({
          district:
            row.district === 'Kota Bharu'
              ? 'K. Bharu'
              : row.district === 'Tanah Merah'
              ? 'T. Merah'
              : row.district === 'Pasir Puteh'
              ? 'P. Puteh'
              : row.district === 'Pasir Mas'
              ? 'P. Mas'
              : row.district === 'Kuala Krai'
              ? 'K. Krai'
              : row.district === 'Gua Musang'
              ? 'G. Musang'
              : row.district,
          fullName: row.district,
          mentees: row.mentees,
          sessions: row.sessions,
          endorsements: row.endorsements
        }));

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
            completedSessions: completedSessionsCount,
            totalLogs: mentorLogs.length,
            totalEndorsements: activeEndorsementCount,
            districtRows,
            sectorRows,
            generatedDate: todayLabel,
            refCode: `LAP-${currentMentor.id.toUpperCase()}-${new Date().getFullYear()}`
          });
        };

        const maxDistrictMentees = Math.max(1, ...districtRows.map((r) => r.mentees));
        const maxSectorCount = Math.max(1, ...sectorRows.map((r) => r.count));

        return (
          <div key="impact" className="space-y-4 animate-dashboard-tab">
            {/* Header & Export Bar */}
            <div className={`p-4 sm:p-5 rounded-2xl border backdrop-blur-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${mentorTheme.surfaceClass}`}>
              <div className="flex items-center gap-2.5">
                <BarChart3 className={`w-5 h-5 shrink-0 ${mentorTheme.accentTextClass}`} />
                <div>
                  <h3 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-[#F1F5F9] tracking-tight">
                    Laporan Ringkas Bimbingan
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                    Ringkasan jumlah belia, sesi selesai, pecahan daerah, sektor dan eksport laporan.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    try {
                      exportMentorReportToExcel({
                        mentorName: currentMentor.name,
                        mentorAgency: currentMentor.agency,
                        totalMentees: menteeDirectory.length,
                        completedSessions: completedSessionsCount,
                        totalLogs: mentorLogs.length,
                        totalEndorsements: activeEndorsementCount,
                        districtRows,
                        sectorRows
                      });
                      triggerToast('Laporan Excel (.xlsx) berjaya dimuat turun.', 'success');
                    } catch {
                      triggerToast('Gagal menjana fail Excel laporan.', 'error');
                    }
                  }}
                  className={`px-4 py-2 text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${mentorTheme.secondaryButtonClass}`}
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Eksport Excel (.xlsx)</span>
                </button>
                <button
                  type="button"
                  onClick={() => openAndPrintDocument(buildSummaryReportHtml(), 'Laporan Ringkas Mentor KBelia')}
                  className={`px-4 py-2 text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${mentorTheme.secondaryButtonClass}`}
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
                  className={`px-4 py-2 text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${mentorTheme.primaryButtonClass}`}
                >
                  <Download className="w-4 h-4" />
                  <span>Muat Turun PDF</span>
                </button>
              </div>
            </div>

            {/* 4 Angka Ringkas */}
            <div className={`grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x rounded-2xl border backdrop-blur-xs ${mentorTheme.surfaceClass} ${mentorTheme.dividerClass}`}>
              <div className="p-4 sm:p-5">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
                  Jumlah Belia
                </span>
                <p className="font-display text-2xl font-bold text-slate-900 dark:text-[#F1F5F9] mt-1 tabular-nums">
                  {menteeDirectory.length}
                </p>
              </div>
              <div className="p-4 sm:p-5">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
                  Sesi Selesai
                </span>
                <p className="font-display text-2xl font-bold text-slate-900 dark:text-[#F1F5F9] mt-1 tabular-nums">
                  {completedSessionsCount}
                </p>
              </div>
              <div className="p-4 sm:p-5">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
                  Nota Sesi
                </span>
                <p className="font-display text-2xl font-bold text-slate-900 dark:text-[#F1F5F9] mt-1 tabular-nums">
                  {mentorLogs.length}
                </p>
              </div>
              <div className="p-4 sm:p-5">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
                  Surat Sokongan
                </span>
                <p className={`font-display text-2xl font-bold mt-1 tabular-nums ${mentorTheme.accentTextClass}`}>
                  {activeEndorsementCount}
                </p>
              </div>
            </div>

            {/* Dual Visual Charts: District Bar Chart & Sector Composition Donut */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              <div className={`lg:col-span-7 rounded-2xl border backdrop-blur-xs p-4 sm:p-5 flex flex-col min-w-0 ${mentorTheme.surfaceClass}`}>
                <div className={`flex flex-wrap items-center justify-between gap-2 pb-3 border-b mb-3 shrink-0 ${mentorTheme.dividerClass}`}>
                  <h4 className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-[#F1F5F9]">
                    Prestasi Daerah (Belia, Sesi &amp; Sokongan)
                  </h4>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {districtRows.length} daerah aktif
                  </span>
                </div>

                {chartDistrictData.length === 0 ? (
                  <div className="flex-1 min-h-[230px] flex items-center justify-center text-sm text-slate-600 dark:text-slate-400">
                    Tiada data daerah untuk dipaparkan.
                  </div>
                ) : (
                  <div className="relative flex-1 min-h-[230px] w-full min-w-0 [&_.recharts-cartesian-axis-tick_text]:fill-slate-600 dark:[&_.recharts-cartesian-axis-tick_text]:fill-slate-300">
                    <div className="absolute inset-0">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 600, height: 240 }}>
                      <BarChart
                        data={chartDistrictData}
                        barCategoryGap="18%"
                        barGap={3}
                        margin={{ top: 18, right: 8, left: -8, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.22)" />
                        <XAxis dataKey="district" tick={{ fontSize: 12, fontWeight: 600 }} interval={0} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          cursor={{ fill: 'rgba(37, 99, 235, 0.10)' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload as {
                                fullName: string;
                                mentees: number;
                                sessions: number;
                                endorsements: number;
                              };
                              return (
                                <div className={`px-3 py-2 rounded-xl text-xs font-mono shadow-xl border ${mentorTheme.tooltipBgClass}`}>
                                  <div className="font-bold mb-1">{d.fullName}</div>
                                  <div>Belia: {d.mentees}</div>
                                  <div>Sesi Selesai: {d.sessions}</div>
                                  <div>Sokongan Geran: {d.endorsements}</div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="mentees" name="Belia" fill="#2563EB" radius={[5, 5, 0, 0]} maxBarSize={24} />
                        <Bar dataKey="sessions" name="Sesi" fill="#0D9488" radius={[5, 5, 0, 0]} maxBarSize={24} />
                        <Bar dataKey="endorsements" name="Sokongan" fill="#D97706" radius={[5, 5, 0, 0]} maxBarSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

              <RoleDonutCard
                className="lg:col-span-5 h-full"
                role="mentor"
                title="Komposisi Sektor Perniagaan"
                icon={Sparkles}
                segments={sectorSegments}
                centerValue={menteeDirectory.length}
                centerLabel="Belia"
                valueUnit="usahawan"
                summaryPairs={[
                  {
                    label: sectorRows[0]?.sector || 'Sektor Utama',
                    value: sectorRows[0]?.count ? `${sectorRows[0].count} Belia` : 'Tiada',
                    dotColor: SECTOR_PALETTE[0]
                  },
                  {
                    label: sectorRows[1]?.sector || 'Sektor Kedua',
                    value: sectorRows[1]?.count ? `${sectorRows[1].count} Belia` : 'Tiada',
                    dotColor: SECTOR_PALETTE[1]
                  }
                ]}
                emptyState={{
                  title: 'Tiada Data Sektor',
                  description: 'Komposisi sektor akan dipaparkan apabila belia didaftarkan.'
                }}
              />
            </div>

            {/* Pecahan Daerah & Sektor Terperinci */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
              <div className={`rounded-2xl border backdrop-blur-xs overflow-hidden flex flex-col ${mentorTheme.surfaceClass}`}>
                <div className={`px-4 py-3 border-b ${mentorTheme.surfaceMutedClass} ${mentorTheme.dividerClass}`}>
                  <h4 className="font-display text-sm font-bold text-slate-900 dark:text-[#F1F5F9]">
                    Pecahan Mengikut Daerah
                  </h4>
                </div>
                {districtRows.length === 0 ? (
                  <p className="p-6 text-sm text-slate-600 dark:text-slate-400 text-center">
                    Tiada rekod daerah lagi.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className={`border-b text-xs font-semibold text-slate-600 dark:text-slate-400 ${mentorTheme.dividerClass}`}>
                          <th className="py-2.5 px-4">Daerah</th>
                          <th className="py-2.5 px-3 text-right">Belia</th>
                          <th className="py-2.5 px-3 text-right">Sesi</th>
                          <th className="py-2.5 px-4 text-right">Sokongan</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y text-sm ${mentorTheme.dividerClass}`}>
                        {districtRows.map((row) => (
                          <tr key={row.district} className={mentorTheme.rowHoverClass}>
                            <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-[#F1F5F9]">
                              <div>{row.district}</div>
                              <div className="w-24 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700/70 overflow-hidden mt-1.5">
                                <div
                                  className={`h-full rounded-full transition-[width] duration-500 ${mentorTheme.progressFillClass}`}
                                  style={{ width: `${Math.round((row.mentees / maxDistrictMentees) * 100)}%` }}
                                />
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                              {row.mentees}
                            </td>
                            <td className="py-2.5 px-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                              {row.sessions}
                            </td>
                            <td className={`py-2.5 px-4 text-right tabular-nums font-semibold ${mentorTheme.accentTextClass}`}>
                              {row.endorsements}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className={`rounded-2xl border backdrop-blur-xs overflow-hidden flex flex-col ${mentorTheme.surfaceClass}`}>
                <div className={`px-4 py-3 border-b ${mentorTheme.surfaceMutedClass} ${mentorTheme.dividerClass}`}>
                  <h4 className="font-display text-sm font-bold text-slate-900 dark:text-[#F1F5F9]">
                    Pecahan Mengikut Sektor
                  </h4>
                </div>
                {sectorRows.length === 0 ? (
                  <p className="p-6 text-sm text-slate-600 dark:text-slate-400 text-center">
                    Tiada rekod sektor lagi.
                  </p>
                ) : (
                  <div className={`divide-y ${mentorTheme.dividerClass}`}>
                    {sectorRows.map((row) => (
                      <div key={row.sector} className="px-4 py-2.5 space-y-1.5">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium text-slate-900 dark:text-[#F1F5F9] truncate">
                            {row.sector}
                          </span>
                          <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-[#F1F5F9] shrink-0">
                            {row.count} belia
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700/70 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-[width] duration-500 ${mentorTheme.progressFillClass}`}
                            style={{ width: `${Math.round((row.count / maxSectorCount) * 100)}%` }}
                          />
                        </div>
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
      {/* TAB 4: PROFIL MENTOR (2-COLUMN EDITORIAL + LIVE MENTEE PREVIEW)       */}
      {/* ===================================================================== */}
      {currentSubTab === 'profile' && (() => {
        const profileChecklist = [
          { label: 'Nama Penuh', done: Boolean(currentMentor.name?.trim()) },
          { label: 'Jawatan & Agensi', done: Boolean(currentMentor.title?.trim() && currentMentor.agency?.trim()) },
          { label: 'Telefon & Emel', done: Boolean(currentMentor.phone?.trim() && currentMentor.email?.trim()) },
          { label: 'Bidang Kepakaran', done: Boolean(currentMentor.expertise && currentMentor.expertise.length > 0) },
          { label: 'Ringkasan Profil', done: Boolean(currentMentor.bio?.trim() && currentMentor.bio.trim().length >= 20) }
        ];
        const completedChecklistCount = profileChecklist.filter((c) => c.done).length;
        const profilePct = Math.round((completedChecklistCount / profileChecklist.length) * 100);

        return (
          <div key="profile" className="grid grid-cols-1 lg:grid-cols-[minmax(0,55fr)_minmax(0,45fr)] gap-4 items-stretch animate-dashboard-tab">
            {/* Left Column: Editorial Profile & Completeness */}
            <div className={`rounded-2xl border backdrop-blur-xs p-5 sm:p-6 space-y-5 ${mentorTheme.surfaceClass}`}>
              <div className={`pb-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${mentorTheme.dividerClass}`}>
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-900 dark:text-[#F1F5F9]">
                    Profil &amp; Maklumat Mentor
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                    Maklumat rasmi yang dipaparkan kepada usahawan belia untuk tempahan sesi.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(true)}
                  className={`interactive-press px-4 py-2 font-semibold text-sm flex items-center gap-2 shrink-0 self-start sm:self-auto cursor-pointer whitespace-nowrap ${mentorTheme.primaryButtonClass}`}
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Sunting Profil</span>
                </button>
              </div>

              {/* Profile Completeness Bar */}
              <div className={`p-4 rounded-xl border space-y-3 ${mentorTheme.surfaceMutedClass} ${mentorTheme.dividerClass}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-[#F1F5F9]">
                    Tahap Kelengkapan Profil
                  </span>
                  <span className={`font-display text-sm font-bold tabular-nums ${profilePct === 100 ? 'text-emerald-600 dark:text-emerald-400' : mentorTheme.accentStrongTextClass}`}>
                    {profilePct}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700/70 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-[width] duration-500 ${
                      profilePct === 100 ? 'bg-emerald-600 dark:bg-emerald-400' : mentorTheme.progressFillClass
                    }`}
                    style={{ width: `${profilePct}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-0.5">
                  {profileChecklist.map((item) => (
                    <span
                      key={item.label}
                      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                        item.done
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.label}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Structured Profile Fields */}
              <div className={`divide-y ${mentorTheme.dividerClass}`}>
                <div className="py-3 first:pt-0 grid grid-cols-1 sm:grid-cols-[148px_1fr] gap-1 sm:gap-4 items-baseline">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Nama Penuh
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-[#F1F5F9]">
                    {currentMentor.name}
                  </p>
                </div>

                <div className="py-3 grid grid-cols-1 sm:grid-cols-[148px_1fr] gap-1 sm:gap-4 items-baseline">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Jawatan &amp; Agensi
                  </span>
                  <p className="text-sm font-medium text-slate-900 dark:text-[#F1F5F9]">
                    {currentMentor.title} &middot;{' '}
                    <span className={`font-semibold ${mentorTheme.accentTextClass}`}>{currentMentor.agency}</span>
                  </p>
                </div>

                <div className="py-3 grid grid-cols-1 sm:grid-cols-[148px_1fr] gap-1 sm:gap-4 items-baseline">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Saluran Perhubungan
                  </span>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-slate-900 dark:text-[#F1F5F9]">
                      <Phone className={`w-4 h-4 shrink-0 ${mentorTheme.accentTextClass}`} />
                      <span className="font-mono tabular-nums">+{currentMentor.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-900 dark:text-[#F1F5F9]">
                      <Mail className={`w-4 h-4 shrink-0 ${mentorTheme.accentTextClass}`} />
                      <span>{currentMentor.email}</span>
                    </div>
                  </div>
                </div>

                <div className="py-3 grid grid-cols-1 sm:grid-cols-[148px_1fr] gap-1 sm:gap-4 items-baseline">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Bidang Kepakaran
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {currentMentor.expertise.map((exp, idx) => (
                      <span
                        key={idx}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${mentorTheme.activeNavClass}`}
                      >
                        {exp}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="py-3 last:pb-0 grid grid-cols-1 sm:grid-cols-[148px_1fr] gap-1 sm:gap-4 items-baseline">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Ringkasan Profil
                  </span>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                    {currentMentor.bio}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Live Public Mentee-View Card Preview */}
            <div className={`rounded-2xl border backdrop-blur-xs p-5 space-y-4 ${mentorTheme.surfaceClass}`}>
              <div className={`pb-3 border-b flex items-center justify-between gap-2 ${mentorTheme.dividerClass}`}>
                <div className="flex items-center gap-2">
                  <Eye className={`w-4 h-4 shrink-0 ${mentorTheme.accentTextClass}`} />
                  <h4 className="font-display text-sm font-bold text-slate-900 dark:text-[#F1F5F9]">
                    Pratonton Kad Pandangan Usahawan
                  </h4>
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Paparan Awam
                </span>
              </div>

              <div className={`p-5 rounded-2xl border space-y-4 ${mentorTheme.surfaceMutedClass} ${mentorTheme.dividerClass}`}>
                <div className="flex items-start gap-3.5">
                  <div className={`w-14 h-14 rounded-full overflow-hidden border shrink-0 bg-white dark:bg-slate-900 ${mentorTheme.dividerClass}`}>
                    <PortalImage
                      src={currentMentor.avatarUrl}
                      alt={currentMentor.name}
                      fallbackType="avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[11px] font-semibold ${mentorTheme.activeNavClass}`}>
                      Aktif Membimbing
                    </span>
                    <div className="font-display text-base font-bold text-slate-900 dark:text-[#F1F5F9]">
                      {currentMentor.name}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      {currentMentor.title} &bull;{' '}
                      <span className={`font-semibold ${mentorTheme.accentTextClass}`}>{currentMentor.agency}</span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-slate-900 dark:text-[#F1F5F9] leading-relaxed">
                  {currentMentor.bio}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {currentMentor.expertise.map((exp, idx) => (
                    <span
                      key={idx}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-medium bg-white dark:bg-slate-900 text-slate-900 dark:text-[#F1F5F9] ${mentorTheme.dividerClass}`}
                    >
                      {exp}
                    </span>
                  ))}
                </div>

                <div className={`pt-3 border-t flex flex-wrap items-center justify-end gap-2 text-xs text-slate-500 dark:text-slate-400 ${mentorTheme.dividerClass}`}>
                  <span className={`font-semibold ${mentorTheme.accentTextClass}`}>
                    {menteeDirectory.length > 0 ? `${menteeDirectory.length} belia aktif` : 'Belum ada belia aktif'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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
                  <h3 className="font-display font-bold text-base text-slate-900 dark:text-[#F1F6FA]">
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
              {menteeDirectory.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Pilih Belia Sedia Ada (Isi Pantas)
                  </label>
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      const picked = menteeDirectory.find((m) => m.key === e.target.value);
                      if (!picked) return;
                      setNewEndorsementMenteeName(picked.menteeName);
                      setNewEndorsementBusinessName(picked.businessName);
                      if (picked.category) setNewEndorsementCategory(picked.category);
                      if (picked.district) setNewEndorsementDistrict(picked.district);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-sm cursor-pointer ${mentorTheme.inputClass}`}
                  >
                    <option value="">-- Pilih belia seliaan atau taip di bawah --</option>
                    {menteeDirectory.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.menteeName} — {m.businessName} ({m.district})
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
                    <option value="Fesyen, Batik & Kraf Kelantan">Fesyen, Batik &amp; Kraf Kelantan</option>
                    <option value="Teknologi & Servis Digital">Teknologi &amp; Servis Digital</option>
                    <option value="Kecantikan & Kesihatan">Kecantikan &amp; Kesihatan</option>
                    <option value="Pertanian & Agrotek">Pertanian &amp; Agrotek</option>
                    <option value="Runcit & Gaya Hidup">Runcit &amp; Gaya Hidup</option>
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

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Justifikasi Perakuan *
                  </label>
                  <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                    {newEndorsementJustification.length} aksara
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {ENDORSEMENT_JUSTIFICATION_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => {
                        setNewEndorsementCategory(tpl.category);
                        setNewEndorsementJustification(tpl.justification);
                        setNewEndorsementReadiness(tpl.readiness);
                      }}
                      className={`px-2.5 py-1 text-xs font-semibold cursor-pointer whitespace-nowrap ${mentorTheme.secondaryButtonClass}`}
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
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
                    className="mt-0.5 rounded w-4 h-4 accent-[#1D4ED8] dark:accent-[#3B82F6] cursor-pointer"
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
                  className={`px-4 py-2 text-sm font-semibold cursor-pointer ${mentorTheme.secondaryButtonClass}`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 text-sm font-bold shadow-xs flex items-center gap-1.5 cursor-pointer ${mentorTheme.primaryButtonClass}`}
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
                <MiddleTruncate text={selectedEndorsementForView.endorsementCode} startChars={11} endChars={5} className="font-bold text-black" />
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
                <p className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 italic text-black leading-relaxed kbelia-prose">
                  &ldquo;<AcronymText text={selectedEndorsementForView.justification} />&rdquo;
                </p>
              </div>

              <div className="space-y-1 font-sans">
                <strong className="text-black">Penilaian Tahap Kesediaan Operasi:</strong>
                <p className="text-black kbelia-prose">
                  <AcronymText text={selectedEndorsementForView.businessReadinessRemark} />
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
                <QrCodeGraphic
                  value={buildVerificationQrPayload(selectedEndorsementForView.endorsementCode)}
                  size={96}
                  caption="SAH DIPERAKUKAN"
                  subcaption={selectedEndorsementForView.endorsementCode}
                  showDownloadButton
                  downloadFileName={`QR_Perakuan_${selectedEndorsementForView.endorsementCode}.png`}
                />
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
                  <h3 className="font-display font-bold text-base text-slate-900 dark:text-[#F1F6FA]">
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
              {!editingLogId && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 mr-1">
                      Templat:
                    </span>
                    {LOGBOOK_QUICK_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => {
                          setNewLogTopic(tpl.topic);
                          setNewLogMinutes(tpl.minutes);
                          setNewLogTasks(
                            tpl.tasks.map((t, idx) => ({
                              id: `act-${Date.now()}-${idx + 1}`,
                              task: t,
                              dueDate: getPlusDaysIso((idx + 1) * 7),
                              completed: false
                            }))
                          );
                        }}
                        className={`px-2.5 py-1 text-xs font-semibold cursor-pointer whitespace-nowrap ${mentorTheme.secondaryButtonClass}`}
                      >
                        {tpl.label}
                      </button>
                    ))}
                  </div>

                  {menteeDirectory.length > 0 && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                        Pilih Belia Sedia Ada (Isi Pantas)
                      </label>
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          const picked = menteeDirectory.find((m) => m.key === e.target.value);
                          if (!picked) return;
                          setNewLogMenteeName(picked.menteeName);
                          setNewLogBusinessName(picked.businessName);
                        }}
                        className={`w-full px-3 py-2 rounded-xl text-sm cursor-pointer ${mentorTheme.inputClass}`}
                      >
                        <option value="">-- Pilih belia seliaan atau taip di bawah --</option>
                        {menteeDirectory.map((m) => (
                          <option key={m.key} value={m.key}>
                            {m.menteeName} — {m.businessName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

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
                  <label className="block text-sm font-bold text-slate-900 dark:text-[#F1F6FA]">
                    Senarai Tugasan ({newLogTasks.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddModalTaskRow}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[0.8125rem] font-semibold shadow-2xs transition-colors cursor-pointer whitespace-nowrap ${mentorTheme.primaryButtonClass}`}
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
                                    ? 'bg-[#1D4ED8] border-[#1D4ED8] dark:bg-[#3B82F6] dark:border-[#3B82F6] text-white'
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
                  className={`px-4 py-2 text-sm font-semibold cursor-pointer ${mentorTheme.secondaryButtonClass}`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-sm font-bold shadow-xs cursor-pointer ${mentorTheme.primaryButtonClass}`}
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
                  <h3 className="font-display font-bold text-base text-slate-900 dark:text-[#F1F6FA]">
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
                  placeholder="https://meet.google.com/..."
                  className={`w-full px-3 py-2 rounded-xl text-sm ${mentorTheme.inputClass}`}
                />
              </div>

              <div className={`pt-3 border-t flex items-center justify-end gap-2 ${mentorTheme.dividerClass}`}>
                <button
                  type="button"
                  onClick={() => setSelectedMenteeForNotes(null)}
                  className={`px-4 py-2 text-sm font-semibold cursor-pointer ${mentorTheme.secondaryButtonClass}`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-sm font-bold shadow-xs flex items-center gap-1.5 cursor-pointer ${mentorTheme.primaryButtonClass}`}
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
              <h3 className="font-display font-bold text-sm text-slate-900 dark:text-[#F1F6FA]">
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
