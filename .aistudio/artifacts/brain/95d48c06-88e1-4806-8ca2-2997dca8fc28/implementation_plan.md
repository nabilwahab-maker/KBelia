# Pelan Pengurangan Data Demo & Pembersihan Aset Repositori KBELIA

Pelan pelaksanaan terperinci bagi membuang lebihan data demo dan mengekalkan tepat 3 rekod berkualiti tinggi bagi setiap bahagian utama (3 perniagaan direktori, 3 kapsul niaga/kiosk, 3 produk pasaran B2B, 3 program keusahawanan belia, dan 3 profil mentor pakar), serta membuang fail-fail imej duplikasi dan aset tidak digunakan bagi mengurangkan saiz repositori dan menyelesaikan ralat semasa `git push` ke GitHub.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Berdasarkan maklum balas anda dalam sesi soal jawab sebelum ini:
> - **Had Rekod Demo**: Data dikurangkan kepada tepat **3 item berkualiti tinggi** bagi setiap bahagian:
>   1. **3 Direktori Perniagaan Belia** (Mewakili sektor F&B, Kraf/Batik Tradisi, dan Perkhidmatan Digital)
>   2. **3 Kapsul Niaga / Kiosk** (Hub UMK Bachok, KB Sentral Kota Bharu, dan Jeli)
>   3. **3 Produk Pasaran B2B** (Akok Warisan Kelantan, Keropok Lekor Crispy, dan Batik Canting Sutera)
>   4. **3 Program Pembangunan Belia** (Geran Usahawan Digital, Klinik Bimbingan UMK, Inkubator Kapsul)
>   5. **3 Profil Mentor Pakar** (Pakar Pemasaran Digital UMK, Jurulatih Kraf INSKEN, dan Perunding Kewangan SME)
>   6. **3 Pendaftaran Mentee Aktif** (Padanan bimbingan aktif)
> - **Pembersihan Aset Imej Berat**: Memadam salinan imej duplikasi dan imej tidak terpakai (lebih 40MB fail tidak perlu termasuk duplikasi antara `/public/assets/generated` dan `/src/assets/images`) agar saiz repositori menjadi ringan dan proses push ke GitHub berjaya tanpa sebarang ralat saiz/masa tamat.

---

### 1. Overview & Core Concept

- **Matlamat Utama**: Mengoptimumkan saiz repositori projek KBELIA agar saiz muat naik ke GitHub sangat pantas, ringan, dan bebas ralat penolakan saiz fail GitHub (fail besar/timeout), sambil mengekalkan integriti pengalaman pengguna dan fungsi interaktif portal secara menyeluruh.
- **Kualiti 3 Item Terpilih**: 3 item bagi setiap kategori dipilih dengan teliti supaya mewakili identiti keusahawanan belia Kelantan (warisan, inovasi moden, dan khidmat digital), lengkap dengan data koordinat daerah, status sewaan, harga, nombor pendaftaran SSM, dan maklumat WhatsApp.
- **Nilai Tambah**: Memastikan komponen antaramuka seperti peta daerah Kelantan, carta bajet sewaan, penapis kategori, laci troli B2B, dan portal bimbingan mentor tetap berfungsi lancar dengan data yang padat dan kemas.

---

### 2. User Experience & Visual Design

- **Rupa & Ketumpatan Antaramuka (UI Density)**:
  - **Kapsul Niaga (3 Kiosk)**: Grid 3 lajur yang kemas pada skrin desktop (`grid-cols-1 md:grid-cols-3`), memaparkan status sewaan (Diduduki vs Tersedia), kadar sewa bulanan berpatutan, dan butang tindakan tempahan/maklumat penyewa.
  - **Direktori Belia (3 Perniagaan)**: Kad perniagaan berkualiti tinggi dengan lencana pengesahan rasmi, penarafan bintang, kategori industri, dan pautan terus WhatsApp serta lokasi daerah.
  - **Pasaran Borong B2B (3 Produk)**: Paparan kad produk dengan kuantiti pesanan minimum (MOQ), harga bertingkat, dan butang tambah ke troli.
  - **Program & Hebahan (3 Acara/Inisiatif)**: Kad program dengan tarikh pelaksanaan, lokasi institusi penganjur, dan butang permohonan segera.
  - **Portal Mentor (3 Pakar Bimbingan)**: Kad mentor pakar dengan kepakaran spesifik, agensi naungan (UMK CEED, INSKEN, SME Corp), jadual slot mingguan, dan modul permohonan klinik keusahawanan.

- **Kekal Konsisten**: Tema warna rasmi KBELIA (Emas Dinar Kelantan, Biru Korporat UMK, dan Latar Lembut Mesra Mata / Mod Gelap Biru Laut) kekal utuh tanpa herotan susun atur walaupun bilangan item dikurangkan kepada 3.

---

### 3. Key Product Decisions & Trade-Offs

- **Keputusan 1: Pemilihan 3 Rekod Terbaik Setiap Kategori**
  - *Pendekatan*: Mengekalkan rekod yang mempunyai data paling lengkap (gambar sah, nombor SSM, koordinat daerah, perincian kemudahan kiosk).
  - *Rasional*: Memastikan tiada komponen UI yang pecah atau menghasilkan ralat `undefined` semasa rendering kad atau modal terperinci.
  
- **Keputusan 2: Pembersihan Imej Duplikasi Tanpa Memecahkan URL Aset**
  - *Pendekatan*: Menstandardkan semua laluan imej merujuk kepada direktori tunggal `/public/assets/generated/` (yang disajikan secara langsung oleh Vite dev server dan production build). Memadam fail pendua yang tidak dirujuk serta direktori `src/assets/images/` yang mengandungi salinan fail sama.
  - *Rasional*: Mengurangkan saiz direktori projek serta-merta sebanyak lebih ~30MB - 40MB, menghapuskan beban git commit objek binari besar yang menjadi punca utama kegagalan push ke GitHub.

- **Keputusan 3: Penyelarasan Pangkalan Data Firestore & Penyimpanan Tempatan (Fallback)**
  - *Pendekatan*: Mengemaskini pemalar `INITIAL_*` dalam `seedData.ts` dan `mentorData.ts` serta membersihkan rekod cache `localStorage` lama supaya pelayar memuatkan set 3 item terkini secara seragam.
  - *Rasional*: Menjamin pengguna yang membuka aplikasi akan terus melihat set 3 item baharu tanpa kekeliruan data lama dalam simpanan pelayar.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        KBELIA DATA ARCHITECTURE                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   src/data/seedData.ts                 src/data/mentorData.ts          │
│   ┌───────────────────────────────┐    ┌─────────────────────────┐     │
│   │ INITIAL_CAPSULE_SLOTS   (3)   │    │ INITIAL_MENTOR_PROFILES │ (3) │
│   │ INITIAL_BUSINESSES      (3)   │    │ INITIAL_REGISTRATIONS   │ (3) │
│   │ INITIAL_PRODUCTS        (3)   │    └─────────────────────────┘     │
│   │ INITIAL_PROGRAMS        (3)   │                                    │
│   └──────────────┬────────────────┘                                    │
│                  │                                                     │
│                  ▼                                                     │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │               State Management & Firestore Sync              │     │
│   │   (App.tsx / DataService.ts / AuthContext.tsx / LocalStorage)│     │
│   └──────────────┬───────────────────────────────┬───────────────┘     │
│                  │                               │                     │
│                  ▼                               ▼                     │
│   ┌──────────────────────────────┐ ┌─────────────────────────────────┐ │
│   │  Katalog & Direktori Awam    │ │    Portal Usahawan & Mentor     │ │
│   │  - CapsuleGrid (3 Kiosk)     │ │    - MerchantPortal (3 Bisnes)  │ │
│   │  - DirectorySection (3 Biz)  │ │    - MentorPortal (3 Pakar)     │ │
│   │  - B2BMarketSection (3 Prod) │ │    - AdminDashboard (3 Permoh.) │ │
│   │  - ProgramsSection (3 Prog)  │ └─────────────────────────────────┘ │
│   └──────────────────────────────┘                                     │
│                                                                        │
│   Aset Imej Ringan:                                                    │
│   /public/assets/generated/  --->  Hanya fail aktif disimpan (~5MB)    │
│   Duplikasi & fail lama      --->  Dibuang daripada git tracking       │
└────────────────────────────────────────────────────────────────────────┘
```

#### Struktur Data 3 Item Terpilih:

1. **3 Kapsul Niaga (Kiosk)**:
   - `cap-umk-01`: Kapsul Inkubator F&B A1 (Hub UMK Bachok - Diduduki)
   - `cap-kb-01`: Kapsul Niaga KB Sentral B1 (Kota Bharu - Diduduki)
   - `cap-jeli-01`: Kapsul Agrotek & Herba C1 (Jeli - Tersedia / Kosong)

2. **3 Direktori Perniagaan Belia**:
   - `biz-01`: D'Kelate Artisan Coffee & Pastry (Bachok - F&B)
   - `biz-02`: Batik Belia Kontemporari (Kota Bharu - Kraf & Fesyen)
   - `biz-03`: AgroKelulut Inovasi Kelantan (Jeli - Pertanian & Biotek)

3. **3 Produk Pasaran B2B**:
   - `prod-01`: Akok Tradisi Kelantan Premium (F&B / Kudapan)
   - `prod-02`: Keropok Lekor Crispy Pasir Puteh (F&B / Makanan Sejuk Beku)
   - `prod-03`: Kain Batik Canting Eksklusif Belia (Kraf Warisan & Fesyen)

4. **3 Program Pembangunan Belia**:
   - `prog-01`: Geran Pemerkasaan Usahawan Digital Belia Kelantan (SBEC 2026)
   - `prog-02`: Klinik Diagnostik & Skalabiliti Perniagaan UMK CEED
   - `prog-03`: Program Inkubator Kapsul Niaga Belia Kelantan Fasa 2

5. **3 Profil Mentor Pakar**:
   - `mentor-1`: Prof. Madya Dr. Wan Azhar (UMK CEED - Pemasaran Digital & E-Dagang)
   - `mentor-2`: Puan Siti Aminah Binti Yusof (INSKEN - Kraf, Fesyen & Eksport)
   - `mentor-3`: En. Khairul Hafiz Bin Razali, CA (SME Advisor - Kewangan & Perakaunan)

---

### Langkah Pelaksanaan Selepas Kelulusan:
1. Kemaskini `src/data/seedData.ts` untuk memotong semua senarai kepada tepat 3 item setiap satu.
2. Kemaskini `src/data/mentorData.ts` untuk memotong profil mentor dan pendaftaran kepada 3 item.
3. Semak komponen pengguna (`App.tsx`, `CapsuleGrid.tsx`, `DirectorySection.tsx`, `B2BMarketSection.tsx`, `ProgramsSection.tsx`, `MentorPortal.tsx`) untuk memastikan render 3 item lancar.
4. Buang fail imej duplikasi yang berat dalam `/src/assets/images` dan fail tidak terpakai dalam `/public/assets/generated` untuk mengecilkan saiz repositori secara dramatik.
5. Jalankan `compile_applet` dan `lint_applet` untuk mengesahkan tiada ralat sintaks, import, atau types.
