# Pelan Transformasi Menyeluruh UI/UX: Reka Bentuk Moden & Mesra Pengguna Portal KBELIA Kelantan

## 1. Analisis Keperluan & 15 Prinsip UI/UX (Berdasarkan Rujukan Grafik)

Pengguna telah mengemukakan maklum balas bahawa papan pemuka (*dashboard*) semasa kelihatan kurang memuaskan dan meminta transformasi visual menyeluruh berasaskan **15 Prinsip UI/UX Terbaik** daripada rujukan grafik:

| # | Prinsip UI/UX daripada Gambar | Amalan Kurang Sesuai (*Don't*) | Piawaian Reka Bentuk Baharu (*Do*) | Aplikasi Khusus dalam Portal KBELIA |
| :-: | :--- | :--- | :--- | :--- |
| **01** | **Radio button VS Card** (Gambar 08) | Senarai butang radio bulat biasa yang mendatar | **Kad Pilihan Interaktif** dengan sempadan aktif, lencana harga & penunjuk visual | Pemilihan Pakej Geran & Slot Kapsul/Kiosk diubah menjadi kad pilihan moden. |
| **02** | **Clear CTAs** (Gambar 07) | Teks generik "Ya / Tidak" atau "OK / Batal" | **Teks Tindakan Spesifik**: *"Ya, Padam Produk"*, *"Simpan Maklumat"*, *"Hantar Permohonan"* | Semua butang modal pengesahan, padam, tempahan, dan simpan profil. |
| **03** | **Prominence to Key Elements** (Gambar 08b) | Harga/kadar sewa tersorok di bahagian bawah kad | **Serlahkan Harga & Status** bersebelahan tajuk utama dengan tipografi tebal | Kad Kiosk Kapsul (`RM150/bulan`) & Kad Produk Direktori (`RM25.00`) diberi penonjolan segera. |
| **04** | **Provide Hierarchy** (Gambar 03) | Borang panjang tanpa pembahagian kategori | **Kategori Borang Berhierarki** (cth: *Maklumat Peribadi*, *Maklumat Perniagaan*, *Akaun Bank*) | `RegisterPage`, `BookingModal`, `GrantModal`, dan `SettingsPage` dipecahkan mengikut bahagian kad berstruktur. |
| **05** | **Primary CTA Stands Out** (Gambar 05b) | Dua butang bersebelahan dengan warna sama tebal | **Hierarki Butang Terang**: Butang Utama (Solid warna jenama) vs Butang Sekunder (Garis luar/Ghost) | Pasangan butang Batal/Teruskan dalam semua modal dan borang papan pemuka. |
| **06** | **Inline Error Messages** (Gambar 07b) | Longgokan teks ralat di bawah borang | **Mesej Ralat Sebaris (Inline)** tepat di bawah input medan berkenaan dengan sempadan merah | Medan mandatori yang tidak lengkap memaparkan amaran segera di bawah kotak input. |
| **07** | **Formatted Placeholders** (Gambar 03b) | Teks kabur seperti "Masukkan emel....." | **Format Contoh Nyata** (cth: `faizul@artisan.my`, `+6011-2050 8890`, `D-1234567-K`) | Memberi panduan format input nombor SSM, telefon WhatsApp, dan pautan media sosial. |
| **08** | **Don't use Placeholder as Label** (Gambar 04b) | Tiada label atas, hanya bergantung pada placeholder | **Label Jelas & Kekal** di atas setiap kotak input berserta tanda merah `*` | Semua medan borang mempunyai tajuk medan kekal yang tidak hilang apabila ditaip. |
| **09** | **Radio vs Checkbox/Toggle** (Gambar 04) | Butang radio digunakan untuk persetujuan tunggal | **Kotak Semak (Checkbox)** piawai untuk persetujuan syarat & terma | Borang permohonan geran, sewaan kapsul, dan terma pendaftaran. |
| **10** | **Don't Overuse Popups** (Gambar 05) | Pop-up modal berlapis untuk tindakan kecil | **Maklum Balas Sebaris / Kad Dalam Halaman** atau *Toast Notification* lembut | Pengesahan status, notis bimbingan mentor, dan status kelulusan dipaparkan terus dalam aliran halaman. |
| **11** | **Desaturate Colors in Dark Mode** (Gambar 02b) | Warna biru/merah terlalu terang menyakitkan mata dalam mod gelap | **Warna Tona Lembut & Nyaman** (*desaturated hues*) dengan kontras WCAG AA | Memperhalusi warna teks dan latar belakang gelap (`#1C2434` / `#1A222C`) agar mesra penglihatan. |
| **12** | **No Unnecessary Letter Spacing** (Gambar 06) | Jarak huruf (*tracking*) terlalu renggang pada perenggan | **Jarak Huruf Semula Jadi** (*tracking-normal*) untuk bacaan teks panjang yang lancar | Menyingkirkan `tracking-widest` pada huraian produk dan teks artikel. |
| **13** | **Make Text Easily Scannable** (Gambar 06b) | Blok teks padat yang sukar diimbas pantas | **Format Imbas Pantas**: Ikon, lencana data (*chips*), senarai berbutir (*bullet points*) | Huraian program geran, spesifikasi kiosk, dan statistik jualan usahawan. |
| **14** | **Clean Email Address Input** (Gambar 09) | Medan emel terpisah atau rekaan berpecah | **Satu Medan Bersatu** dengan pengesahan emel terbina | Medan log masuk dan pendaftaran akaun. |
| **15** | **Strong Logo Location** (Gambar 02) | Logo di tengah memecahkan susun atur navigasi | **Logo Ditambat di Sudut Kiri Atas** diikuti susunan navigasi kemas ke kanan | Menyelaraskan reka bentuk penjenamaan KBELIA di bar navigasi atas. |

---

## 2. Pelan Naik Taraf Komponen Mengikut Bahagian

### A. Papan Pemuka Utama & Kad Kiosk (`Home` & `CapsulesSection.tsx`)
- **Penonjolan Elemen Utama**:
  - Kadar sewa bulanan (contoh: **RM150 / bulan**) dipaparkan dengan saiz fon lebih besar dan lencana subsidi Kerajaan Negeri Kelantan betul-betul di sisi tajuk kiosk.
- **Tukar Pilihan Tempoh Sewa kepada Kad Interaktif**:
  - Di dalam `BookingModal`, tukar pemilihan tempoh sewa (1 Bulan / 3 Bulan / 6 Bulan / 1 Tahun) daripada senarai biasa kepada **grid kad interaktif** yang memaparkan:
    - Tempoh Sewaan
    - Jumlah Bayaran & Penjimatan Subsidi
    - Penanda aktif sempadan merah/emas apabila dipilih.
- **Butang Tindakan**:
  - Butang utama: `"Hantar Permohonan Sewaan (RM150)"` (bukan "Hantar" sahaja).
  - Butang sekunder: `"Batal & Kembali"`.

### B. Direktori Usahawan & Kad Produk (`DirectorySection.tsx` & `ProductsSection.tsx`)
- **Penstrukturan Semula Kad Produk**:
  - Meletakkan tanda harga produk bersebelahan nama produk dengan rekaan kontras tinggi.
  - Memperbaiki hierarki teks: Nama Produk (bold) → Kategori/Jajahan (lencana halus) → Butiran harga → Butang Hubungi WhatsApp Usahawan.
- **Format Imbas Pantas**:
  - Menggantikan perenggan teks yang panjang dengan senarai spesifikasi ringkas (Status Halal, SSM, Lokasi Jajahan).

### C. Hab Bantuan & Geran Modal (`ProgramsSection.tsx` & `GrantModal.tsx`)
- **Pemilihan Skim Geran Bentuk Kad Interaktif**:
  - Di dalam `GrantModal`, senarai geran disusun sebagai kad pilihan (*feature cards*) dengan amaun maksimum dana (cth: **RM 20,000**) terserlah di bahagian atas kad.
- **Hierarki Borang Bertingkat**:
  - Bahagian 1: Maklumat Pemohon & Bisnes
  - Bahagian 2: Pemilihan Skim Bantuan
  - Bahagian 3: Justifikasi Penggunaan Modal & Dokumen Sokongan
- **Kotak Semak Pengesahan Terma**:
  - Menggunakan checkbox piawai berserta pautan syarat rasmi SUK Kelantan.
  - Butang tindakan: `"Hantar Permohonan Geran Rasmi"` (Solid) dan `"Tutup Tetingkap"` (Outline).

### D. Profil Bisnes Saya & Tetapan Akaun (`MerchantPortal.tsx` & `SettingsPage.tsx`)
- **Pengelompokan Berhierarki**:
  - Mengasingkan input kepada 4 kad berasingan:
    1. *Profil Asas & SSM*
    2. *Pautan Media Sosial & Hubungi (WhatsApp / IG / FB)*
    3. *Maklumat Akaun Bank untuk Pembayaran*
    4. *Keselamatan & Tukar Kata Laluan*
- **Placeholder Format Tepat**:
  - Pautan WhatsApp: `https://wa.me/601120508890`
  - Instagram: `@fairuz.artisan`
  - Nombor Akaun: `1620 1234 5678 (Bank Islam / Maybank)`
- **Mesej Ralat Sebaris (Inline Error Validation)**:
  - Sekiranya nombor SSM atau emel tidak sah, amaran dipaparkan terus di bawah kotak berkenaan dengan sempadan merah lembut.

### E. Portal Mentor & Panel Pentadbir (`MentorPortal.tsx` & `AdminDashboard.tsx`)
- **Data Boleh Diimbas Pantas (*Scannable*)**:
  - Statistik utama (Bilangan Mentee, Sesi Selesai, Tindakan Tertunggak) dipaparkan dalam kad ringkasan metrik yang kemas.
  - Jadual mentee diberikan penunjuk status berwarna lembut (*desaturated status pills*): Hijau zamrud (Selesai), Ungu (Temu Janji Google Meet), Amber (Menunggu Tindakan).
- **Modal Tindakan Mentor yang Spesifik**:
  - Butang: `"Sahkan Sesi Bimbingan"` / `"Kemaskini Profil Mentor"` / `"Batal Tindakan"`.

### F. Penalaan Mod Gelap Menyeluruh (*Desaturate Colors for Dark Mode*)
- Menggantikan warna merah/biru gelap yang terlalu tepu dengan tona warna yang lebih lembut, mesra mata, dan memenuhi piawaian kebolehcapaian WCAG AA di seluruh `UMKSidebar`, `UMKHeader`, dan panel kandungan.

---

## 3. Pelan Pengesahan & Pengujian Kualiti

1. **Ujian Visual Mengikut 15 Prinsip**:
   - Memastikan tiada lagi pemilihan berasaskan radio asas bagi pilihan utama — semuanya telah dinaik taraf kepada kad interaktif.
   - Memastikan semua butang modal mempunyai teks tindakan berorientasikan kata kerja yang spesifik (*Specific Action CTAs*).
   - Memastikan harga dan kadar sewa segera kelihatan pada imbasan pertama.
2. **Ujian Kebolehbacaan & Borang**:
   - Uji borang dengan input tidak lengkap dan sahkan ralat muncul di bawah medan berkenaan secara sebaris (*inline error*).
   - Periksa placeholder di semua borang untuk memastikan format contoh realistik.
3. **Ujian Mod Gelap (*Dark Mode*)**:
   - Togol mod gelap dan sahkan kontras warna teks dan butang lembut serta selesa dipandang tanpa warna neon yang menyakitkan mata.
4. **Semakan Binaan Kod**:
   - Jalankan `compile_applet` untuk mengesahkan binaan sifar ralat.
   - Jalankan `lint_applet` untuk pengesahan TypeScript.
