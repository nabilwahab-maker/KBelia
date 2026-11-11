# Pelan Penambahbaikan Antara Muka KBelia: Penyeragaman Tema, Penjenamaan & Bar Sisi

Pelan ini menggariskan langkah-langkah pelaksanaan bagi membetulkan ketidaksamaan kontras warna tema cerah/gelap, membuang perkataan "pakar", membuang "UMK CEED" pada pengepala atas bar sisi, menyeragamkan penjenamaan "KBelia", serta memudahkan label butang pada bar sisi.

## Keputusan & Maklum Balas Pengguna

> [!IMPORTANT]
> Berdasarkan jawapan balas sesi temu bual ringkas pengguna:
> - **Gaya Butang Bar Sisi**: Menggunakan frasa tindakan pendek (cth: *Sewa Kiosk*, *Cari Usahawan*, *Mohon Geran*).
> - **Gaya Mod Cerah di Halaman Utama**: Menggunakan latar putih bersih dengan teks kelabu gelap berkontras tinggi (`#0F172A` / `#334155`) tanpa tompokan gelap yang janggal.

---

### 1. Gambaran Keseluruhan & Konsep Teras
- **Matlamat Utama**: Memastikan pengalaman visual KBelia lancar, mudah dibaca dalam mod cerah dan gelap, menyingkirkan elemen teks yang tidak diperlukan ("pakar" & "UMK CEED"), memperkemas format jenama kepada **KBelia**, serta memastikan teks butang menu bar sisi muat dengan kemas tanpa terpotong.
- **Kumpulan Sasaran**: Usahawan belia Kelantan, mentor universiti/industri, dan pentadbir sistem.

---

### 2. Pengalaman Pengguna & Reka Bentuk Visual

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Papan Pemuka / Halaman KBelia                   │
├───────────────────────────────┬────────────────────────────────────────┤
│ Pengepala Atas Bar Sisi       │ Kandungan Utama                        │
│ [KB] KBelia                   │                                        │
│ (Tiada lagi 'UMK CEED')       │ Mod Cerah: Latar putih bersih          │
├───────────────────────────────┤ Teks berkontras tinggi (slate-900)     │
│ Butang Bar Sisi (Ringkas):    │ Tiada latar gelap keras tanpa tema     │
│ • Papan Pemuka                │                                        │
│ • Sewa Kiosk                  │ Mod Gelap: dark:bg-slate-900           │
│ • Cari Usahawan               │ Teks terang bersih (dark:text-white)   │
│ • Mohon Geran                 │                                        │
│ • Portal Mentor               │ Penamaan Konsisten:                    │
│   (Perkataan 'Pakar' Dibuang) │ 'KBelia' (Bukan KBELIA)                │
└───────────────────────────────┴────────────────────────────────────────┘
```

#### A. Penyeragaman Tema Cerah & Gelap (Zero Dark Stains in Light Mode)
- **Halaman Utama (`LandingPage.tsx`)**:
  - Bahagian Statistik Impak: Ubah daripada `bg-slate-900` keras kepada kad putih bersih (`bg-white border-slate-200 text-slate-900 shadow-xs`) semasa mod cerah, dan `dark:bg-slate-900 dark:border-slate-800 dark:text-white` semasa mod gelap.
  - Bahagian Galeri Bergerak & Kapsul: Padankan latar jalur galeri dengan mod cerah (`bg-slate-100/90 text-slate-900 border-slate-200`) dan mod gelap (`dark:bg-slate-900 dark:text-white`).
  - Bahagian Panggilan Tindakan Terakhir (*CTA Banner*): Tukar latar hitam keras kepada latar tematik responsif (`bg-blue-50/80 border-blue-200 text-slate-900` pada mod cerah; `dark:bg-slate-900 dark:border-slate-800 dark:text-white` pada mod gelap).
- **Audit Kontras Komponen Lain**: Memastikan tiada teks kelabu pudar di atas latar kelabu atau teks gelap di atas latar gelap merentasi semua modal dan kad produk.

#### B. Pembuangan Perkataan "Pakar" Secara Menyeluruh
- Mengimbas dan mengemaskini semua teks daripada:
  - `"Portal Pakar Mentor"` ➔ `"Portal Mentor"`
  - `"Pakar Mentor"` ➔ `"Mentor"`
  - `"Hab Bimbingan Pakar"` ➔ `"Hab Bimbingan Mentor"`
- Berlaku pada:
  - `src/components/UMKHeader.tsx`
  - `src/components/UMKSidebar.tsx`
  - `src/components/MentorPortal.tsx`
  - `src/components/MentorshipClinicModal.tsx`
  - `src/components/LandingPage.tsx`
  - `src/data/mentorData.ts` & `src/data/seedData.ts`

#### C. Pembuangan "UMK CEED" di Bahagian Atas Bar Sisi
- Pada pengepala jenama di `src/components/UMKHeader.tsx` (di atas bar sisi sebelah kiri):
  - Buang teks `· UMK CEED`.
  - Tinggalkan hanya logo `KB` dan perkataan **KBelia**.
  - Paparkan sub-teks peranan yang jelas bagi setiap kategori pengguna:
    - Usahawan Belia: `Portal Usahawan`
    - Mentor: `Portal Mentor`
    - Pentadbir: `Panel Pentadbir`

#### D. Penyeragaman Ejaan Jenama "KBelia"
- Mengubah semua perkataan `KBELIA` kepada **`KBelia`** mengikut format yang diminta oleh pengguna di dalam:
  - Pengepala aplikasi (`UMKHeader.tsx`)
  - Halaman Utama (`LandingPage.tsx`)
  - Tajuk dokumen & metadata (`index.html`, `metadata.json`)
  - Bar navigasi dan komponen berkaitan

#### E. Peringkasan Butang Bar Sisi (Sidebar Short Action Labels)
- Menggantikan ayat-ayat panjang yang melimpah/terpotong kepada frasa tindakan pendek yang padat:
  - *Sebelum*: "Permohonan & Semakan Kiosk Kapsul Niaga" ➔ *Selepas*: **"Sewa Kiosk"**
  - *Sebelum*: "Direktori & Katalog Perniagaan Belia Kelantan" ➔ *Selepas*: **"Cari Usahawan"**
  - *Sebelum*: "Permohonan Dana Benih & Geran Keusahawanan" ➔ *Selepas*: **"Mohon Geran"**
  - *Sebelum*: "Klinik & Sesi Khidmat Bimbingan Mentor Pakar" ➔ *Selepas*: **"Portal Mentor"**
  - *Sebelum*: "Pasaran Iklan Komersial B2B Jajahan" ➔ *Selepas*: **"Pasaran B2B"**
  - *Sebelum*: "Kalkulator Kelayakan Sewa & Subsidi Kiosk" ➔ *Selepas*: **"Kira Subsidi"**
  - *Sebelum*: "Pusat Kawalan & Giliran Kelulusan Pentadbir" ➔ *Selepas*: **"Pusat Kawalan"**
  - *Sebelum*: "Pengurusan Profil & Tetapan Akaun Pengguna" ➔ *Selepas*: **"Tetapan"**

---

### 3. Keputusan Utama Produk & Reka Bentuk

1. **Keputusan 1: Konsistensi Mod Cerah & Gelap**
   - *Pilihan*: Menghapuskan semua kelas latar belakang gelap tanpa varian `dark:` pada elemen aras halaman utama.
   - *Sebab*: Menghilangkan tompokan gelap pada mod cerah yang menyukarkan pembacaan pengguna.

2. **Keputusan 2: Pemeliharaan Struktur Tanpa Kehilangan Ciri**
   - *Pilihan*: Menukar hanya label dan kelas penggayaan visual tanpa merosakkan fungsi penghalaan (*tab routing*), pengesahan (*authentication*), atau pengurusan data Firestore.
   - *Sebab*: Memastikan kestabilan penuh aplikasi sambil menyelesaikan 100% isu visual yang dilaporkan.

---

### 4. Pelan Pengesahan & Pengujian
- **Pengesahan Visual**:
  - Uji pertukaran tema Mod Cerah dan Mod Malam: pastikan semua teks mudah dibaca dan tiada bahagian gelap melekat pada mod cerah.
  - Periksa bar sisi: pastikan tiada perkataan terpotong pada resolusi standard dan ketiadaan "UMK CEED".
  - Semak semua halaman mentor: pastikan perkataan "pakar" telah dinyahkan.
  - Sahkan ejaan konsisten "KBelia".
- **Pengesahan Kod**:
  - Laksanakan `compile_applet` dan `lint_applet` bersama untuk memastikan sifar ralat TypeScript atau sintaks.
