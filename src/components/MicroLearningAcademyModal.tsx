import React, { useState } from 'react';
import { 
  GraduationCap, 
  X, 
  CheckCircle2, 
  BookOpen, 
  Award, 
  Clock, 
  ChevronRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface MicroLearningAcademyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CourseModule {
  id: string;
  title: string;
  category: string;
  duration: string;
  description: string;
  keyPoints: string[];
  isCompleted: boolean;
  badge: string;
}

const COURSES: CourseModule[] = [
  {
    id: '1',
    title: 'Pengurusan Aliran Tunai & Untung Bersih Kiosk',
    category: 'Kewangan',
    duration: '5 Minit',
    description: 'Panduan praktikal mengasingkan duit modal pusingan, bayaran sewa bersubsidi, dan mengira untung bersih harian.',
    keyPoints: [
      'Asingkan akaun bank peribadi dan akaun perniagaan secara mutlak.',
      'Simpan sekurang-kurangnya RM150 pada awal bulan untuk sewa kiosk bersubsidi.',
      'Gunakan DuitNow QR untuk mengelakkan ketirisan tunai fizikal.'
    ],
    isCompleted: true,
    badge: 'Lencana Kewangan Bijak UMK'
  },
  {
    id: '2',
    title: 'Standard Kebersihan & Pematuhan PBT Kelantan',
    category: 'Operasi',
    duration: '6 Minit',
    description: 'Pematuhan standard keselamatan makanan, suntikan tifoid, dan susun atur ruang niaga kiosk kapsul.',
    keyPoints: [
      'Penyewa F&B wajib mempunyai sijil suntikan tifoid yang sah.',
      'Sisa makanan mesti dibungkus rapi dan dibuang ke tong kitar semula kampus/daerah.',
      'Pastikan suis elektrik dan soket tidak terlebih beban (overload).'
    ],
    isCompleted: false,
    badge: 'Lencana Kebersihan Piawai MPKB'
  },
  {
    id: '3',
    title: 'Pemasaran WhatsApp Commerce & TikTok Shop Tempatan',
    category: 'Pemasaran Digital',
    duration: '7 Minit',
    description: 'Teknik menarik pelanggan sekitar kampus UMK dan penduduk jajahan berkunjung ke kiosk anda.',
    keyPoints: [
      'Gunakan pautan WhatsApp ringkas dengan mesej pesanan siap sedia.',
      'Muat naik video pendek suasana kiosk di TikTok dengan hashtag #NiagaBeliaKelantan.',
      'Tawarkan diskaun 10% untuk pelajar UMK yang menunjukkan kad matrik.'
    ],
    isCompleted: false,
    badge: 'Lencana Pemasar Digital Belia'
  },
  {
    id: '4',
    title: 'Asas Permohonan Pensijilan Halal JAKIM / JHEIK',
    category: 'Pematuhan',
    duration: '8 Minit',
    description: 'Langkah mudah melengkapkan dokumen Halal untuk meluaskan pasaran produk warisan Kelantan ke peringkat antarabangsa.',
    keyPoints: [
      'Semak semua ramuan makanan mempunyai sijil Halal yang diiktiraf JAKIM.',
      'Lantik sekurang-kurangnya seorang penyelia Muslim bagi pemantauan operasi.',
      'Simpan fail rekod pembekal bahan mentah dengan kemas.'
    ],
    isCompleted: false,
    badge: 'Lencana Pematuhan Halal'
  }
];

export const MicroLearningAcademyModal: React.FC<MicroLearningAcademyModalProps> = ({
  isOpen,
  onClose
}) => {
  const [courses, setCourses] = useState<CourseModule[]>(COURSES);
  const [activeCourse, setActiveCourse] = useState<CourseModule>(COURSES[0]);

  if (!isOpen) return null;

  const handleCompleteCourse = (courseId: string) => {
    setCourses(courses.map(c => c.id === courseId ? { ...c, isCompleted: true } : c));
  };

  const completedCount = courses.filter(c => c.isCompleted).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-amber-300/60 dark:border-amber-500/30 scale-100 transition-all max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-300/40 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Akademi Mikro-Latihan Keusahawanan Belia
              </h3>
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                Pusat Pembangunan Usahawan Universiti Malaysia Kelantan (UMK)
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Tracker Banner */}
        <div className="rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 p-4 mb-6 flex items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block mb-0.5">
              Pencapaian Kursus Mikro: {completedCount} / {courses.length} Selesai
            </span>
            <span className="text-[11px] text-amber-700 dark:text-amber-400">
              Setiap lencana yang diperoleh meningkatkan skor keutamaan kelulusan dana geran sebanyak +15%!
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-200/60 dark:bg-amber-900/60 px-3 py-1.5 rounded-xl shrink-0">
            <Award className="w-4 h-4" />
            {completedCount} Lencana
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Course List */}
          <div className="md:col-span-5 flex flex-col gap-2.5">
            {courses.map((course) => {
              const isSelected = activeCourse.id === course.id;
              return (
                <div
                  key={course.id}
                  onClick={() => setActiveCourse(course)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-2 ${
                    isSelected
                      ? 'bg-amber-100/70 dark:bg-amber-950/60 border-amber-400 dark:border-amber-600 shadow-sm'
                      : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200/60 dark:border-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block mb-0.5">
                      {course.category} · {course.duration}
                    </span>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">
                      {course.title}
                    </h5>
                  </div>
                  {course.isCompleted && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Active Course Viewer */}
          <div className="md:col-span-7 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                  {activeCourse.category}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {activeCourse.duration}
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                {activeCourse.title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                {activeCourse.description}
              </p>

              <div className="space-y-2 mb-4">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Isi Penting Praktikal:
                </span>
                {activeCourse.keyPoints.map((point, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0 mt-1.5" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                {activeCourse.badge}
              </span>

              {!activeCourse.isCompleted ? (
                <button
                  type="button"
                  onClick={() => handleCompleteCourse(activeCourse.id)}
                  className="py-1.5 px-4 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-sm"
                >
                  Selesai & Tebur Lencana
                </button>
              ) : (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Lencana Diperoleh
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
