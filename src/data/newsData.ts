import { NewsCategory, PortalNews } from '../types';

export const NEWS_CATEGORIES: NewsCategory[] = [
  'Pengumuman',
  'Geran & Dana',
  'Program & Acara',
  'Kapsul Niaga',
  'Info Terkini'
];

export const NEWS_IMAGE_PRESETS: { label: string; url: string }[] = [
  { label: 'Hab Kiosk Belia KBelia', url: '/assets/generated/kiosk_modular_kbelia.jpg' },
  { label: 'Smart Pod Niaga Kelantan', url: '/assets/generated/kiosk_modular_kbelia_1793924253417.jpg' },
  { label: 'Mercu Tanda Kelantan', url: '/assets/generated/banner_kelantan_landmark_1793924253242.jpg' },
  { label: 'Batik & Kraf Belia', url: '/assets/generated/batik_canting_kelantan.jpg' },
  { label: 'Produk Kopi & F&B Lokal', url: '/assets/generated/kopi_nissem_melaka.jpg' },
  { label: 'Agrotek Madu Kelulut', url: '/assets/generated/madu_kelulut_rimba.jpg' }
];

export const INITIAL_PORTAL_NEWS: PortalNews[] = [
  {
    id: 'news-demo-01',
    title: 'Permohonan Kiosk Belia Kelantan Sesi 2026 Dibuka Dengan Subsidi Sewaan 50%',
    summary:
      'Kerajaan Negeri bersama UMK melancarkan pengambilan baharu tapak kiosk modular berhawa dingin di Kota Bharu, Bachok, Jeli dan Tumpat untuk usahawan muda berumur 18 hingga 35 tahun.',
    content:
      'Pentadbir Pembangunan Usahawan Belia Kelantan (KBelia) dengan sukacitanya mengumumkan pembukaan permohonan tapak Kiosk Belia Sesi 2026 bermula minggu ini.\n\nInisiatif ini menawarkan subsidi sewaan sehingga 50% bagi tempoh enam bulan pertama bagi membantu usahawan muda memulakan perniagaan fizikal tanpa beban modal permulaan yang tinggi.\n\nSetiap unit kiosk dilengkapi kemudahan asas termasuk soket elektrik 13A, capaian WiFi berkelajuan tinggi, rak paparan moden, serta kod QR DuitNow bagi rekod jualan harian.\n\nPemohon yang berminat perlu mempunyai pendaftaran perniagaan yang sah atau sedang dalam proses pengesahan SSM serta menyertakan ringkasan pelan perniagaan melalui modul Tempahan Kiosk di portal ini.',
    category: 'Pengumuman',
    imageUrl: '/assets/generated/kiosk_modular_kbelia.jpg',
    status: 'published',
    isPinned: true,
    authorId: 'demo-admin-id',
    authorName: 'Pentadbir Nabil (Admin KBelia)',
    publishedAt: '2026-11-12T09:00:00.000Z',
    updatedAt: '2026-11-12T09:00:00.000Z',
    createdAt: '2026-11-12T09:00:00.000Z'
  },
  {
    id: 'news-demo-02',
    title: 'Geran Permulaan & Pemangkin Usahawan Belia Sehingga RM10,000 Kini Dibuka Untuk Semakan',
    summary:
      'Usahawan belia yang telah menjalani sekurang-kurangnya satu sesi klinik bimbingan mentor layak memohon geran peralatan dan bahan mentah pusingan pertama.',
    content:
      'Skim Geran Permulaan Belia Kelantan (RM3,000) dan Dana Pemangkin Skala Niaga (RM10,000) kini dibuka kepada semua usahawan belia aktif yang beroperasi di seluruh Kelantan.\n\nKeutamaan diberikan kepada perniagaan sektor Makanan & Minuman, Kraf & Batik kontemporari, Agrotek serta servis digital yang mempunyai rekod jualan konsisten dan surat sokongan daripada Mentor.\n\nCalon boleh menyemak kelayakan awal menggunakan Kalkulator Kelayakan Geran dan menghantar permohonan terus melalui tab Geran & Pembiayaan Belia.\n\nSemua permohonan akan melalui penilaian telus oleh Jawatankuasa Penilai Negeri dan keputusan akan dimaklumkan melalui notifikasi akaun masing-masing.',
    category: 'Geran & Dana',
    imageUrl: '/assets/generated/kopi_nissem_melaka.jpg',
    status: 'published',
    isPinned: false,
    authorId: 'demo-admin-id',
    authorName: 'Pentadbir Nabil (Admin KBelia)',
    publishedAt: '2026-11-10T10:30:00.000Z',
    updatedAt: '2026-11-10T10:30:00.000Z',
    createdAt: '2026-11-10T10:30:00.000Z'
  },
  {
    id: 'news-demo-03',
    title: 'Karnival Usahawan Muda Kelantan & Sesi Pitching Produk Lokal 2026 di KB Sentral',
    summary:
      'Lebih 40 reruai usahawan belia, sesi padanan pembekal Ruang Niaga dan pertandingan pitching dana perniagaan bakal menghimpunkan komuniti niaga muda Pantai Timur.',
    content:
      'Karnival Usahawan Muda Kelantan edisi tahun ini bakal berlangsung selama tiga hari di perkarangan KB Sentral, Kota Bharu dengan sasaran penyertaan lebih 40 jenama belia tempatan.\n\nAntara pengisian utama termasuk Pavilion Produk F&B dan Batik Belia, klinik semakan penjenamaan oleh pensyarah keusahawanan UMK, serta sesi padanan pembekal Ruang Niaga.\n\nPenyewa kiosk sedia ada digalakkan mendaftar slot pameran melalui menu Acara & Karnival bagi mempromosikan produk masing-masing kepada pelawat dan pelabur tempatan.',
    category: 'Program & Acara',
    imageUrl: '/assets/generated/banner_kelantan_landmark_1793924253242.jpg',
    status: 'published',
    isPinned: false,
    authorId: 'demo-admin-id',
    authorName: 'Penganjur Acara KBelia',
    publishedAt: '2026-11-08T14:15:00.000Z',
    updatedAt: '2026-11-08T14:15:00.000Z',
    createdAt: '2026-11-08T14:15:00.000Z'
  },
  {
    id: 'news-demo-04',
    title: 'Naik Taraf Smart Pod: WiFi 500Mbps & Sistem POS Rekod Tunai Kini Aktif di 6 Hab Daerah',
    summary:
      'Penambahbaikan infrastruktur digital di hab Bachok, Kota Bharu, Pasir Mas dan Tumpat memudahkan penyewa merekod jualan harian serta menerima bayaran tanpa tunai.',
    content:
      'Pasukan teknikal hab KBelia telah selesai melaksanakan fasa pertama naik taraf infrastruktur rangkaian di enam lokasi Kiosk Belia utama.\n\nDengan sambungan WiFi 500Mbps yang lebih stabil, peniaga boleh menggunakan ciri Buku Tunai & POS di portal tanpa gangguan serta menyemak prestasi jualan harian secara langsung.\n\nSebarang isu teknikal bekalan elektrik, kunci pintar atau sambungan rangkaian boleh dilaporkan terus oleh penyewa menerusi borang Aduan Penyelenggaraan untuk tindakan segera juruteknik hab.',
    category: 'Kapsul Niaga',
    imageUrl: '/assets/generated/kiosk_modular_kbelia_1793924253417.jpg',
    status: 'published',
    isPinned: false,
    authorId: 'demo-admin-id',
    authorName: 'Unit Teknikal & Fasiliti KBelia',
    publishedAt: '2026-11-05T11:20:00.000Z',
    updatedAt: '2026-11-05T11:20:00.000Z',
    createdAt: '2026-11-05T11:20:00.000Z'
  },
  {
    id: 'news-demo-05',
    title: 'Jadual Klinik Bimbingan Mentor UMK & Bantuan Pengesahan SSM Pantas Bulan Ini',
    summary:
      'Panel mentor bertauliah dari UMK dan agensi keusahawanan membuka slot konsultasi bersemuka dan Google Meet untuk semakan kos, penjenamaan dan strategi jualan.',
    content:
      'Usahawan belia yang ingin memperkukuh rancangan perniagaan sebelum memohon pembiayaan boleh menempah sesi Klinik Bimbingan Mentor secara dalam talian atau bersemuka di kampus.\n\nSetiap mentor akan membimbing usahawan dari aspek pengiraan margin untung, pematuhan pendaftaran SSM, serta menyediakan minit jurnal dan pelan tindakan susulan.\n\nMentor yang terlibat juga boleh mengemas kini jadual kelapangan dan mengeluarkan surat perakuan geran secara digital melalui Portal Mentor masing-masing.',
    category: 'Info Terkini',
    imageUrl: '/assets/generated/batik_canting_kelantan.jpg',
    status: 'published',
    isPinned: false,
    authorId: 'demo-admin-id',
    authorName: 'Sekretariat Bimbingan UMK',
    publishedAt: '2026-11-02T08:45:00.000Z',
    updatedAt: '2026-11-02T08:45:00.000Z',
    createdAt: '2026-11-02T08:45:00.000Z'
  },
  {
    id: 'news-demo-draft-06',
    title: '[Draf] Pengumuman Kerjasama Eksport Produk Kraf & Agrotek Belia ke Pasaran Serantau 2026',
    summary:
      'Draf berita dalam semakan pentadbir mengenai penyertaan produk makanan tahan lama dan kraf belia ke pameran perdagangan antarabangsa.',
    content:
      'Berita ini disimpan sebagai Draf oleh Pentadbir dan hanya dapat dilihat oleh akaun Admin sebelum disemak dan disiarkan kepada semua pengguna Belia serta Mentor.\n\nPentadbir boleh mengedit tajuk, tarikh acara sebenar serta menukar status kepada Siar apabila butiran rasmi dimuktamadkan.',
    category: 'Pengumuman',
    imageUrl: '/assets/generated/wau_bulan_kelantan.jpg',
    status: 'draft',
    isPinned: false,
    authorId: 'demo-admin-id',
    authorName: 'Pentadbir Nabil (Admin KBelia)',
    publishedAt: '',
    updatedAt: '2026-11-12T16:00:00.000Z',
    createdAt: '2026-11-12T16:00:00.000Z'
  }
];
