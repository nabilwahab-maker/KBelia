import { MentorProfile, MentorshipRegistration } from '../types';

export const INITIAL_MENTOR_PROFILES: MentorProfile[] = [
  {
    id: 'mentor-1',
    name: 'Prof. Madya Dr. Wan Azhar',
    title: 'Pengarah Institut Keusahawanan Universiti Malaysia Kelantan (UMK)',
    agency: 'Universiti Malaysia Kelantan (UMK)',
    expertise: [
      'Pemasaran Digital & TikTok Shop',
      'Strategi E-Dagang & Penjenamaan',
      'Pengembangan Perniagaan Belia'
    ],
    avatarUrl: '/public/assets/generated/avatar_mentor_umk_1793924250411.jpg',
    email: 'wanazhar@umk.edu.my',
    phone: '60199887711',
    bio: 'Berpengalaman lebih 15 tahun membimbing usahawan belia dan pelajar IPT di Pantai Timur mencapai jualan 6 angka melalui saluran digital.',
    availableDays: 'Setiap Isnin & Rabu (10:00 AM - 1:00 PM)',
    activeMenteesCount: 3,
    pin: '1234'
  },
  {
    id: 'mentor-2',
    name: 'Puan Siti Aminah Binti Yusof',
    title: 'Pengasas Warisan Batik Kontemporari Kelantan & Jurulatih Bertauliah',
    agency: 'Institut Keusahawanan Negara (INSKEN Coach)',
    expertise: [
      'Penembusan Pasaran Eksport & Fesyen',
      'Kawalan Kualiti Produk & Rantaian Bekalan',
      'Keusahawanan Wanita & Kraf Warisan'
    ],
    avatarUrl: '/public/assets/generated/usahawan_belia_wanita.jpg',
    email: 'sitiaminah.coach@insken.gov.my',
    phone: '60129876543',
    bio: 'Pemenang Anugerah Usahawanita Inovatif Kelantan dan panel bimbingan INSKEN yang telah mengeksport produk kraf ke 8 negara.',
    availableDays: 'Setiap Selasa & Khamis (2:30 PM - 5:00 PM)',
    activeMenteesCount: 2,
    pin: '1234'
  },
  {
    id: 'mentor-3',
    name: 'En. Khairul Hafiz Bin Razali, CA',
    title: 'Perunding Kewangan SME & Juruaudit Bertauliah MIA',
    agency: 'Dewan Perniagaan Melayu Kelantan & SME Corp Panel',
    expertise: [
      'Penyediaan Penyata Kewangan Kiosk',
      'Permohonan Pembiayaan TEKUN, MARA & PUNB',
      'Pengurusan Cukai & Aliran Tunai'
    ],
    avatarUrl: '/public/assets/generated/avatar_admin_kelantan_1793924251898.jpg',
    email: 'khairul.audit@smeadvisor.my',
    phone: '60139123456',
    bio: 'Akauntan bertauliah membantu usahawan mikro menyediakan buku tunai piawai dan kertas kerja pembiayaan perniagaan sehingga RM50,000.',
    availableDays: 'Setiap Rabu & Sabtu (11:00 AM - 3:00 PM)',
    activeMenteesCount: 2,
    pin: '1234'
  }
];

export const INITIAL_MENTORSHIP_REGISTRATIONS: MentorshipRegistration[] = [
  {
    id: 'mentee-reg-1',
    mentorId: 'mentor-1',
    mentorName: 'Prof. Madya Dr. Wan Azhar',
    entrepreneurName: 'Ahmad Nabil Bin Yusoff',
    entrepreneurPhone: '601123456789',
    entrepreneurEmail: 'nabil.kopi@gmail.com',
    businessName: "D'Kelate Artisan Coffee & Pastry",
    district: 'Bachok',
    businessCategory: 'Makanan & Minuman (F&B)',
    topic: 'Strategi Pemasaran TikTok Shop & Video Viral Menu Tempatan',
    challenges: 'Kiosk kami baru mula beroperasi. Perlukan bimbingan bagaimana merakam video TikTok menarik bagi menarik pelancong dan pelajar UMK datang ke kiosk.',
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
    mentorId: 'mentor-1',
    mentorName: 'Prof. Madya Dr. Wan Azhar',
    entrepreneurName: 'Wan Nur Insyirah',
    entrepreneurPhone: '60139988112',
    entrepreneurEmail: 'insyirah.art@gmail.com',
    businessName: 'Batik Belia Kontemporari',
    district: 'Kota Bharu',
    businessCategory: 'Fesyen, Batik & Kraf Kelantan',
    topic: 'Penjenamaan Premium & Jualan Live TikTok',
    challenges: 'Hendak meluaskan capaian pelanggan luar Kelantan menggunakan katalog e-dagang dan Shopee Live.',
    preferredDate: '30 Mac 2026 (Isnin)',
    preferredTime: '11:30 AM - 12:30 PM',
    mode: 'Google Meet Maya',
    status: 'confirmed',
    notes: 'Sesi telah disahkan oleh Prof Wan Azhar. Usahawan diminta sediakan 3 sampel foto produk.',
    mentorActionPlan: '1. Rangka 5 penceritaan (storytelling) warisan Kelantan.\n2. Tetapkan harga diskaun khas bundle pelancong.\n3. Gunakan pencahayaan studio ringkas untuk sesi Live.',
    meetingLink: 'https://meet.google.com/kbe-wanz-2026',
    createdAt: '2026-03-22T14:15:00Z'
  },
  {
    id: 'mentee-reg-3',
    mentorId: 'mentor-2',
    mentorName: 'Puan Siti Aminah Binti Yusof',
    entrepreneurName: 'Siti Sarah Binti Daud',
    entrepreneurPhone: '60178877665',
    entrepreneurEmail: 'sarah.kraf@yahoo.com',
    businessName: 'Anyaman Buluh Kraf Bachok',
    district: 'Bachok',
    businessCategory: 'Fesyen, Batik & Kraf Kelantan',
    topic: 'Penembusan Pasaran Cenderamata Korporat & Eksport',
    challenges: 'Produk anyaman kami diminati tetapi belum mempunyai pembungkusan piawai untuk pasaran antarabangsa.',
    preferredDate: '25 Mac 2026 (Rabu)',
    preferredTime: '2:30 PM - 3:30 PM',
    mode: 'Google Meet Maya',
    status: 'completed',
    notes: 'Sesi bimbingan pembungkusan produk kraftangan dan pengiraan kos telah selesai.',
    mentorActionPlan: '1. Sediakan kad cerita warisan ("craft artisan story card") di dalam setiap kotak.\n2. Hubungi MATRADE untuk geran eksport MDG.\n3. Tetapkan MOQ 50 unit bagi tempahan korporat.',
    meetingLink: 'https://meet.google.com/kbe-insken-2026',
    createdAt: '2026-03-20T10:00:00Z'
  }
];
