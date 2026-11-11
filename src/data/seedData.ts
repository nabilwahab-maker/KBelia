import { BusinessListing, CapsuleSlot, ProductItem, YouthProgram } from '../types';

export const INITIAL_CAPSULE_SLOTS: CapsuleSlot[] = [
  {
    id: 'cap-umk-01',
    code: 'CAP-UMK-01',
    name: 'Kapsul Inkubator F&B A1',
    hubLocation: 'Hub UMK Kampus Bachok (Zon Keusahawanan)',
    district: 'Bachok',
    size: '10ft x 10ft Smart Kiosk',
    monthlyRate: 150,
    dailyRate: 15,
    status: 'occupied',
    amenities: ['Palam Elektrik 13A', 'Bekalan Air Bersih', 'WiFi 500Mbps', 'Rak Paparan Kaca', 'Sistem POS Berpusat'],
    currentTenantBusinessName: "D'Kelate Artisan Coffee & Pastry",
    currentTenantId: 'demo-tenant-1',
    imageUrl: '/public/assets/generated/kiosk_modular_kbelia.jpg',
    createdAt: new Date().toISOString()
  },
  {
    id: 'cap-kb-01',
    code: 'CAP-KB-01',
    name: 'Kapsul Niaga KB Sentral B1',
    hubLocation: 'Pusat Transformasi Belia Kota Bharu (KB Sentral)',
    district: 'Kota Bharu',
    size: '12ft x 10ft Commercial Pod',
    monthlyRate: 200,
    dailyRate: 20,
    status: 'occupied',
    amenities: ['Penyaman Udara Terkawal', 'Paparan Skrin Digital LED', 'High-Speed WiFi', 'Ruang Kaunter Bersepadu', 'CCTV 24 Jam'],
    currentTenantBusinessName: 'Studio Belia Multimedia KB',
    currentTenantId: 'demo-tenant-3',
    imageUrl: '/public/assets/generated/kiosk_modular_kbelia.jpg',
    createdAt: new Date().toISOString()
  },
  {
    id: 'cap-jeli-01',
    code: 'CAP-JELI-01',
    name: 'Kapsul Agrotek & Produk Lokal C1',
    hubLocation: 'Hub Komuniti Keusahawanan Jeli (UMK Jeli)',
    district: 'Jeli',
    size: '10ft x 10ft Eco Pod',
    monthlyRate: 130,
    dailyRate: 14,
    status: 'available',
    amenities: ['Chiller & Ruang Simpanan Sejuk', 'Palam Kuasa 13A', 'WiFi Komuniti', 'Rak Paparan Buluh Moden', 'Bantuan Logistik'],
    imageUrl: '/public/assets/generated/madu_kelulut_rimba.jpg',
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_BUSINESSES: BusinessListing[] = [
  {
    id: 'biz-01',
    ownerId: 'demo-tenant-1',
    ownerName: 'Ahmad Faizul Bin Razak',
    ownerEmail: 'faizul.artisan@gmail.com',
    ownerPhone: '+601123456789',
    businessName: "D'Kelate Artisan Coffee & Pastry",
    tagline: 'Kopi bancuhan moden citarasa tempatan & pastry akok leleh',
    category: 'Makanan & Minuman (F&B)',
    district: 'Bachok',
    description: 'Inkubasi perniagaan belia graduan UMK yang menggabungkan seni kopi espresso moden dengan pencuci mulut tradisional Kelantan seperti Akok Tart, Kopi Nissem Melaka dan Croissant Durian Musang King.',
    ssmNumber: '202303123456 (TR0234123-X)',
    whatsapp: '601123456789',
    instagram: '@dkelate.artisan',
    tiktok: '@dkelatecoffee',
    logoUrl: '/public/assets/generated/usahawan_belia_lelaki.jpg',
    bannerUrl: '/public/assets/generated/kopi_nissem_melaka.jpg',
    isApproved: true,
    isFeatured: true,
    capsuleSlotId: 'cap-umk-01',
    rating: 4.9,
    reviewsCount: 42,
    createdAt: new Date().toISOString()
  },
  {
    id: 'biz-02',
    ownerId: 'demo-tenant-2',
    ownerName: 'Nur Syafiqah Binti Zakaria',
    ownerEmail: 'syafiqah.batik@gmail.com',
    ownerPhone: '+60198765432',
    businessName: 'Batik Belia Kontemporari',
    tagline: 'Inovasi batik canting Kelantan berjiwa muda & streetwear',
    category: 'Fesyen, Batik & Kraf Kelantan',
    district: 'Kota Bharu',
    description: 'Memartabatkan warisan batik canting asli Kelantan dengan sentuhan corak geometri moden, kemeja kasual, tote bag kanvas batik, dan aksesori gaya hidup belia.',
    ssmNumber: '202403987654 (KT0192837-W)',
    whatsapp: '60198765432',
    instagram: '@batikbelia.co',
    tiktok: '@batikkontemporari',
    logoUrl: '/public/assets/generated/usahawan_belia_wanita.jpg',
    bannerUrl: '/public/assets/generated/batik_canting_kelantan.jpg',
    isApproved: true,
    isFeatured: true,
    capsuleSlotId: 'cap-kb-01',
    rating: 4.8,
    reviewsCount: 38,
    createdAt: new Date().toISOString()
  },
  {
    id: 'biz-03',
    ownerId: 'demo-tenant-3',
    ownerName: 'Muhammad Harith Bin Yusoff',
    ownerEmail: 'harith.multimedia@gmail.com',
    ownerPhone: '+60139988776',
    businessName: 'Studio Belia Multimedia KB',
    tagline: 'Solusi fotografi produk, video TikTok ads & penjenamaan bisnes belia',
    category: 'Teknologi & Servis Digital',
    district: 'Kota Bharu',
    description: 'Agensi kreatif dipelopori belia Kelantan menawarkan servis fotografi komersil, live streaming TikTok Shop, serta pembikinan video viral promosi usahawan mikro.',
    ssmNumber: '202403445566 (KT0298112-D)',
    whatsapp: '60139988776',
    instagram: '@studiobelia.kb',
    tiktok: '@studiobeliamedia',
    logoUrl: '/public/assets/generated/usahawan_belia_lelaki.jpg',
    bannerUrl: '/public/assets/generated/banner_kelantan_landmark_1793924253242.jpg',
    isApproved: true,
    isFeatured: true,
    capsuleSlotId: 'cap-kb-01',
    rating: 5.0,
    reviewsCount: 19,
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-01',
    businessId: 'biz-01',
    ownerId: 'demo-tenant-1',
    name: 'Kopi Nissem Latte D’Kelate (Iced)',
    price: 8.50,
    description: 'Espresso double shot dicampur susu segar berkrim dan sirap nisan kelapa asli Kelantan.',
    category: 'Minuman Kopi',
    imageUrl: '/public/assets/generated/kopi_nissem_melaka.jpg',
    inStock: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-02',
    businessId: 'biz-02',
    ownerId: 'demo-tenant-2',
    name: 'Kain Pasang Batik Canting Sutera Eksklusif',
    price: 180.00,
    description: 'Batik lukis tangan asli atas fabrik sutera crepe berkualiti tinggi, corak geometri kontemporari.',
    category: 'Tekstil & Fesyen',
    imageUrl: '/public/assets/generated/batik_canting_kelantan.jpg',
    inStock: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-03',
    businessId: 'biz-03',
    ownerId: 'demo-tenant-3',
    name: 'Pakej Fotografi Produk & Video Promosi Media Sosial',
    price: 150.00,
    description: 'Sesi penggambaran 10 keping foto produk beresolusi tinggi beserta 1 video reel 15 saat siap suntingan.',
    category: 'Perkhidmatan Media',
    imageUrl: '/public/assets/generated/product_kelantan_delights_1793924253401.jpg',
    inStock: true,
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_PROGRAMS: YouthProgram[] = [
  {
    id: 'prog-01',
    title: 'Geran Pelancaran Kapsul Belia Kelantan 2026 (Fasa 2)',
    category: 'Geran & Dana',
    date: 'Permohonan Dibuka: 1 - 30 Setiap Bulan',
    location: 'Atas Talian / Hub UMK Bachok',
    description: 'Bantuan subsidi sewaan kapsul niaga sehingga 50% selama 6 bulan pertama serta pembiayaan mikro permulaan RM3,000 untuk belia Kelantan berumur 18-35 tahun.',
    organizer: 'Unit Pembangunan Usahawan Belia & UMK Entrepreneurship Centre',
    grantAmount: 'RM3,000 + Subsidi Sewa Kapsul',
    registrationLink: '#',
    isFeatured: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prog-02',
    title: 'Bengkel Pemasaran Digital & TikTok Shop Usahawan Kapsul',
    category: 'Bengkel & Latihan',
    date: 'Setiap Hari Sabtu (9:00 AM - 1:00 PM)',
    location: 'Studio Media Belia KB Sentral, Kota Bharu',
    description: 'Latihan amali fotografi produk berkualiti tinggi guna telefon pintar, teknik buat live stream berimpak tinggi, dan pengurusan order e-dagang.',
    organizer: 'Komuniti Belia Kreatif Kelantan',
    grantAmount: 'Percuma (Terhad 30 Peserta)',
    registrationLink: '#',
    isFeatured: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prog-03',
    title: 'UMK Youth Capsule Pitch Day & Networking Showcase',
    category: 'Pitching & Inkubasi',
    date: '28 Ogos 2026 (Khamis)',
    location: 'Dewan Keusahawanan UMK Kampus Kota',
    description: 'Peluang membentangkan idea bisnes di hadapan pelabur "angel investors", agensi kerajaan (TEKUN, MARA, PUNB) dan rakan industri tempatan.',
    organizer: 'UMK Venture & Inkubator Belia Kelantan',
    grantAmount: 'Dana Padanan Sehingga RM10,000',
    registrationLink: '#',
    isFeatured: false,
    createdAt: new Date().toISOString()
  }
];
