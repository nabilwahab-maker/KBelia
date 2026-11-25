import { MentorProfile, MentorshipRegistration } from '../types';

export const INITIAL_MENTOR_PROFILES: MentorProfile[] = [
  {
    id: 'mentor-1',
    name: 'Prof. Madya Dr. Wan Azhar',
    title: 'Ketua Panel Bimbingan Pemasaran Digital & Hab Usahawan',
    agency: 'Hab Usahawan KBelia (Mentor Dalaman)',
    expertise: [
      'Pemasaran Digital & E-Dagang',
      'Strategi Penjenamaan & Jualan Dalam Talian',
      'Pengembangan Perniagaan Belia'
    ],
    avatarUrl: '/assets/generated/avatar_mentor_umk_1793924250411.jpg',
    email: 'wanazhar@kbelia.my',
    phone: '60199887711',
    bio: 'Berpengalaman lebih 15 tahun membimbing usahawan belia di Pantai Timur mencapai jualan 6 angka melalui saluran digital dan pengurusan hab keusahawanan.',
    availableDays: '',
    activeMenteesCount: 3,
    updatedAt: '2026-03-01T08:00:00.000Z'
  },
  {
    id: 'mentor-2',
    name: 'Puan Siti Aminah Binti Yusof',
    title: 'Pengasas Kraf Kontemporari & Pakar Industri Keusahawanan',
    agency: 'Rakan Industri & Pembangunan Produk (Pakar Industri)',
    expertise: [
      'Penembusan Pasaran Eksport & Fesyen',
      'Kawalan Kualiti Produk & Rantaian Bekalan',
      'Keusahawanan Wanita & Kraf Warisan'
    ],
    avatarUrl: '/assets/generated/usahawan_belia_wanita.jpg',
    email: 'sitiaminah.mentor@kbelia.my',
    phone: '60129876543',
    bio: 'Pemenang Anugerah Usahawanita Inovatif Kelantan dan pakar industri berpengalaman yang telah membantu mengeksport produk kraf tempatan ke 8 negara.',
    availableDays: '',
    activeMenteesCount: 2,
    updatedAt: '2026-03-01T08:00:00.000Z'
  },
  {
    id: 'mentor-3',
    name: 'En. Khairul Hafiz Bin Razali, CA',
    title: 'Perunding Kewangan Perniagaan & Juruaudit',
    agency: 'Rakan Industri Kewangan & Audit (Pakar Industri)',
    expertise: [
      'Penyediaan Penyata Kewangan Kiosk',
      'Permohonan Pembiayaan Mikro & Geran Digital',
      'Pengurusan Cukai & Aliran Tunai'
    ],
    avatarUrl: '/assets/generated/avatar_admin_kelantan_1793924251898.jpg',
    email: 'khairul.audit@kbelia.my',
    phone: '60139123456',
    bio: 'Akauntan berpengalaman membantu usahawan mikro menyediakan rekod tunai dan kertas kerja pembiayaan mikro serta geran perniagaan sehingga RM50,000.',
    availableDays: '',
    activeMenteesCount: 2,
    updatedAt: '2026-03-01T08:00:00.000Z'
  },
  {
    id: 'mentor-4',
    name: 'Ts. Dr. Norazila Binti Mat Deris',
    title: 'Pakar Agroteknologi & Pemprosesan Makanan (Hab Usahawan Jeli)',
    agency: 'Hab Usahawan KBelia (Mentor Dalaman)',
    expertise: [
      'Pembungkusan & Ketahanan Produk Makanan',
      'Pensijilan Halal & Piawaian Keselamatan Makanan',
      'Rantaian Bekalan Agrotek Kelantan'
    ],
    avatarUrl: '/assets/generated/avatar_youth_female_1793924250745.jpg',
    email: 'norazila.mentor@kbelia.my',
    phone: '60145556677',
    bio: 'Pakar pensijilan keselamatan makanan dan pembangunan produk asas tani membantu usahawan mikro luar bandar menembusi pasaran pasar raya.',
    availableDays: '',
    activeMenteesCount: 1,
    updatedAt: '2026-03-01T08:00:00.000Z'
  }
];

export const INITIAL_MENTORSHIP_REGISTRATIONS: MentorshipRegistration[] = [
  {
    id: 'mentee-reg-1',
    applicantId: 'demo-tenant-1',
    mentorId: 'mentor-1',
    mentorName: 'Prof. Madya Dr. Wan Azhar',
    entrepreneurName: 'Ahmad Faizul Bin Razak',
    entrepreneurPhone: '601123456789',
    entrepreneurEmail: 'faizul.artisan@gmail.com',
    businessName: "D'Kelate Artisan Coffee & Pastry",
    district: 'Bachok',
    businessCategory: 'Makanan & Minuman (F&B)',
    topic: 'Strategi Pemasaran Digital & Video Promosi Menu Tempatan',
    challenges: 'Kiosk kami baru mula beroperasi. Perlukan bimbingan bagaimana merakam video promosi menarik bagi menarik pelancong dan pengunjung sekitar hab ke kiosk.',
    preferredDate: '28 Mac 2026 (Sabtu)',
    preferredTime: '10:00 AM - 11:00 AM',
    mode: 'Bersemuka di Kampus',
    status: 'pending',
    notes: 'Permohonan baharu didaftarkan melalui Kaunter Urusan Pantas Usahawan KBelia.',
    mentorActionPlan: '',
    meetingLink: '',
    createdAt: '2026-03-24T09:30:00Z'
  },
  {
    id: 'mentee-reg-2',
    applicantId: 'demo-tenant-2',
    mentorId: 'mentor-1',
    mentorName: 'Prof. Madya Dr. Wan Azhar',
    entrepreneurName: 'Nur Syafiqah Binti Zakaria',
    entrepreneurPhone: '60198765432',
    entrepreneurEmail: 'syafiqah.batik@gmail.com',
    businessName: 'Batik Belia Kontemporari',
    district: 'Kota Bharu',
    businessCategory: 'Fesyen, Batik & Kraf Kelantan',
    topic: 'Penjenamaan Premium & Jualan Siaran Langsung',
    challenges: 'Hendak meluaskan capaian pelanggan luar Kelantan menggunakan katalog e-dagang dan siaran langsung dalam talian.',
    preferredDate: '30 Mac 2026 (Isnin)',
    preferredTime: '11:30 AM - 12:30 PM',
    mode: 'Google Meet',
    status: 'confirmed',
    notes: 'Sesi telah disahkan oleh Prof. Madya Dr. Wan Azhar. Usahawan diminta sediakan 3 sampel foto produk.',
    mentorActionPlan: '1. Rangka 5 penceritaan (storytelling) warisan Kelantan.\n2. Tetapkan harga diskaun khas bundle pelancong.\n3. Gunakan pencahayaan studio ringkas untuk sesi siaran langsung.',
    meetingLink: 'https://meet.google.com/kbe-wanz-2026',
    createdAt: '2026-03-22T14:15:00Z'
  },
  {
    id: 'mentee-reg-3',
    applicantId: 'demo-tenant-3',
    mentorId: 'mentor-2',
    mentorName: 'Puan Siti Aminah Binti Yusof',
    entrepreneurName: 'Muhammad Harith Bin Yusoff',
    entrepreneurPhone: '60139988776',
    entrepreneurEmail: 'harith.multimedia@gmail.com',
    businessName: 'Studio Belia Multimedia Kota Bharu',
    district: 'Kota Bharu',
    businessCategory: 'Teknologi & Servis Digital',
    topic: 'Penembusan Pasaran Cenderamata Korporat & Eksport',
    challenges: 'Klien korporat memerlukan pakej profil syarikat dan pembungkusan digital piawai.',
    preferredDate: '25 Mac 2026 (Rabu)',
    preferredTime: '2:30 PM - 3:30 PM',
    mode: 'Google Meet',
    status: 'completed',
    notes: 'Sesi bimbingan penjenamaan korporat dan pengiraan kos telah selesai.',
    mentorActionPlan: '1. Sediakan kad katalog pakej korporat.\n2. Mohon Geran Digital & sokongan eksport rakan industri.\n3. Tetapkan MOQ bagi tempahan tahunan.',
    meetingLink: 'https://meet.google.com/kbe-mentor-2026',
    createdAt: '2026-03-20T10:00:00Z'
  }
];
