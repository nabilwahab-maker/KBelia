import { CommunityCategory, CommunityPost, CommunityReply, KelantanDistrict } from '../types';

export const COMMUNITY_CATEGORIES: CommunityCategory[] = [
  'Soal Jawab Geran',
  'Operasi Kapsul',
  'Pemasaran & Jualan',
  'Lesen & SSM',
  'Jaringan Daerah'
];

export const COMMUNITY_DISTRICTS: KelantanDistrict[] = [
  'Kota Bharu',
  'Bachok',
  'Pasir Mas',
  'Tumpat',
  'Tanah Merah',
  'Machang',
  'Pasir Puteh',
  'Kuala Krai',
  'Gua Musang',
  'Jeli'
];

export const INITIAL_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 'comm-demo-01',
    title: 'Tip Menyediakan Kertas Kerja & Aliran Tunai Untuk Permohonan Geran Pemangkin RM10,000',
    content:
      'Salam sejahtera kepada semua usahawan belia Kelantan. Ramai yang bertanya tentang dokumen sokongan terbaik sebelum menghantar permohonan Geran Pemangkin atau mendapatkan surat sokongan Mentor.\n\nPastikan anda menyertakan rekod jualan harian sekurang-kurangnya 30 hari di dalam modul Buku Tunai portal, pecahan perbelanjaan mesin atau bahan mentah yang jelas, serta nombor pendaftaran SSM yang aktif.\n\nJika ada soalan khusus mengenai format bajet atau temujanji semakan mentor, boleh ajukan terus di ruangan balasan di bawah.',
    category: 'Soal Jawab Geran',
    district: 'Kota Bharu',
    authorId: 'mentor-wan-azhar',
    authorName: 'Dr. Wan Azhar',
    authorRole: 'mentor',
    status: 'resolved',
    isPinned: true,
    helpfulUserIds: ['demo-youth-01', 'demo-youth-02', 'demo-admin-01'],
    helpfulCount: 18,
    replyCount: 2,
    acceptedReplyId: 'comm-rep-01',
    createdAt: '2026-11-10T09:00:00.000Z',
    updatedAt: '2026-11-11T14:20:00.000Z'
  },
  {
    id: 'comm-demo-02',
    title: 'Bagaimana Cara Mengira Kos Elektrik & Susun Atur Chiller Dalam Kapsul Niaga 10x10?',
    content:
      'Saya baru mendapat kelulusan untuk slot Kapsul Niaga di Hub Bachok bagi jualan air balang premium dan kuih sejuk beku. Ingin bertanya kepada rakan usahawan yang sudah beroperasi: adakah palam elektrik standard di kapsul mampu menampung 1 unit chiller pintu kaca bersama mesin pengisar?\n\nBagaimana pula cara terbaik menyusun kaunter supaya pelanggan tidak bersesak ketika waktu puncak petang?',
    category: 'Operasi Kapsul',
    district: 'Bachok',
    authorId: 'merchant_faizul',
    authorName: 'Ahmad Faizul',
    authorRole: 'user',
    status: 'resolved',
    isPinned: false,
    helpfulUserIds: ['demo-youth-02'],
    helpfulCount: 9,
    replyCount: 2,
    acceptedReplyId: 'comm-rep-03',
    createdAt: '2026-11-11T10:30:00.000Z',
    updatedAt: '2026-11-12T08:45:00.000Z'
  },
  {
    id: 'comm-demo-03',
    title: 'Mencari Pembekal Bungkusan Kraft Mesra Alam & Pelekat Produk Sekitar Pasir Mas / Kota Bharu',
    content:
      'Perniagaan sambal bilis rangup kami sedang membuat persediaan untuk menyertai Ekspo Usahawan Belia hujung bulan ini. Kami memerlukan pembekal tempatan yang boleh mencetak pelekat kalis minyak serta membekalkan botol kaca 200ml dalam kuantiti awal 300 unit.\n\nJika ada rakan usahawan percetakan atau pembekal di sekitar Kelantan yang menawarkan harga borong, mohon kongsikan maklumat di sini.',
    category: 'Jaringan Daerah',
    district: 'Pasir Mas',
    authorId: 'demo-youth-nurul',
    authorName: 'Nurul Aisyah',
    authorRole: 'user',
    status: 'open',
    isPinned: false,
    helpfulUserIds: [],
    helpfulCount: 5,
    replyCount: 1,
    createdAt: '2026-11-12T15:10:00.000Z',
    updatedAt: '2026-11-12T18:00:00.000Z'
  },
  {
    id: 'comm-demo-04',
    title: 'Adakah Pemohon Geran Benih Perlu Daftar Lesen PBT Terlebih Dahulu Atau Cukup SSM Sahaja?',
    content:
      'Saya baru menjalankan perniagaan jahitan pakaian kasual dari rumah selama 4 bulan dan telah mendaftar SSM secara sah. Saya bercadang memohon Geran Benih Modal RM3,000 serta menempah satu kapsul pameran hujung minggu.\n\nBolehkah pihak Pentadbir atau Mentor mengesahkan sama ada lesen premis PBT wajib dimuat naik semasa peringkat permohonan awal geran?',
    category: 'Lesen & SSM',
    district: 'Machang',
    authorId: 'demo-youth-syafiq',
    authorName: 'Muhammad Syafiq',
    authorRole: 'user',
    status: 'resolved',
    isPinned: false,
    helpfulUserIds: ['merchant_faizul'],
    helpfulCount: 11,
    replyCount: 1,
    acceptedReplyId: 'comm-rep-06',
    createdAt: '2026-11-13T08:20:00.000Z',
    updatedAt: '2026-11-13T11:05:00.000Z'
  },
  {
    id: 'comm-demo-05',
    title: 'Strategi Naikkan Jualan QR & Pesanan Ulangan Pelanggan Untuk Kiosk Makanan Petang',
    content:
      'Kongsi sikit pengalaman saya selepas 2 bulan berniaga di Hub KB Sentral. Dulu pelanggan beli sekali sahaja, tetapi selepas kami letakkan kod QR Kad Digital KBelia bersama kupon diskaun pembelian ke-5 di bungkusan, pelanggan tetap naik hampir 35%.\n\nAda sesiapa yang mahu berkongsi teknik kandungan video pendek TikTok atau WhatsApp Broadcast yang paling berkesan untuk tarik pelanggan sekitar kampus?',
    category: 'Pemasaran & Jualan',
    district: 'Kota Bharu',
    authorId: 'demo-youth-hani',
    authorName: 'Hani Zulaikha',
    authorRole: 'user',
    status: 'open',
    isPinned: false,
    helpfulUserIds: ['mentor-wan-azhar'],
    helpfulCount: 7,
    replyCount: 1,
    createdAt: '2026-11-13T16:40:00.000Z',
    updatedAt: '2026-11-14T07:15:00.000Z'
  }
];

export const INITIAL_COMMUNITY_REPLIES: CommunityReply[] = [
  {
    id: 'comm-rep-01',
    postId: 'comm-demo-01',
    content:
      'Sebagai tambahan, usahawan yang sudah mempunyai rekod Buku Tunai sekurang-kurangnya 2 minggu berturut-turut biasanya lebih cepat lulus peringkat saringan kerana penilai dapat melihat margin untung bersih sebenar.',
    authorId: 'admin',
    authorName: 'Pentadbir KBelia',
    authorRole: 'admin',
    isAccepted: true,
    createdAt: '2026-11-10T11:15:00.000Z'
  },
  {
    id: 'comm-rep-02',
    postId: 'comm-demo-01',
    content:
      'Terima kasih Dr. Wan Azhar dan pihak Pentadbir atas panduan jelas ini. Sangat membantu saya menyediakan pecahan belian peralatan minggu ini.',
    authorId: 'merchant_faizul',
    authorName: 'Ahmad Faizul',
    authorRole: 'user',
    isAccepted: false,
    createdAt: '2026-11-11T14:20:00.000Z'
  },
  {
    id: 'comm-rep-03',
    postId: 'comm-demo-02',
    content:
      'Setiap unit kapsul standard 10x10 dilengkapi soket kuasa 13A dan perlindungan MCB berasingan yang mencukupi untuk 1 chiller sederhana serta peralatan penyediaan minuman ringan. Pastikan tidak menggunakan penyambung pelbagai beban tinggi pada satu soket yang sama.\n\nUntuk susun atur kaunter, letakkan chiller di sudut belakang berhampiran dinding supaya ruang hadapan kekal lapang untuk aliran pelanggan.',
    authorId: 'admin',
    authorName: 'Pentadbir KBelia',
    authorRole: 'admin',
    isAccepted: true,
    createdAt: '2026-11-11T15:00:00.000Z'
  },
  {
    id: 'comm-rep-04',
    postId: 'comm-demo-02',
    content:
      'Betul kata Admin. Saya di Hub Kota Bharu juga letakkan paparan kod QR pembayaran di sebelah kiri kaunter dan tempat ambil pesanan di kanan supaya barisan bergerak sehala.',
    authorId: 'demo-youth-hani',
    authorName: 'Hani Zulaikha',
    authorRole: 'user',
    isAccepted: false,
    createdAt: '2026-11-12T08:45:00.000Z'
  },
  {
    id: 'comm-rep-05',
    postId: 'comm-demo-03',
    content:
      'Syarikat cetak komuniti kami di Tumpat ada menyediakan pelekat kalis minyak saiz custom untuk usahawan KBelia. Boleh semak senarai pembekal kami di Ruang Niaga atau hubungi untuk sampel percuma.',
    authorId: 'demo-youth-irfan',
    authorName: 'Irfan Hakim',
    authorRole: 'user',
    isAccepted: false,
    createdAt: '2026-11-12T18:00:00.000Z'
  },
  {
    id: 'comm-rep-06',
    postId: 'comm-demo-04',
    content:
      'Untuk peringkat permohonan Geran Benih Modal RM3,000, pendaftaran SSM yang aktif sudah memadai. Lesen penjaja atau permit operasi PBT hanya perlu diselesaikan selepas kelulusan penempatan tapak kapsul niaga dikeluarkan.',
    authorId: 'mentor-wan-azhar',
    authorName: 'Dr. Wan Azhar',
    authorRole: 'mentor',
    isAccepted: true,
    createdAt: '2026-11-13T11:05:00.000Z'
  },
  {
    id: 'comm-rep-07',
    postId: 'comm-demo-05',
    content:
      'Tip yang sangat bagus! Cuba gabungkan waktu siaran video pendek sekitar jam 4.00 petang dengan tawaran kombo pelajar selama 2 jam pertama selepas kelas tamat.',
    authorId: 'mentor-wan-azhar',
    authorName: 'Dr. Wan Azhar',
    authorRole: 'mentor',
    isAccepted: false,
    createdAt: '2026-11-14T07:15:00.000Z'
  }
];
