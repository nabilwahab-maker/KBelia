# Pelan Penambahbaikan Aliran Temu Janji Mentor, Pelan Tindakan Mentee & Penjanaan Dokumen PDF

Menghubungkan keseluruhan ekosistem bimbingan usahawan belia dengan mentor secara langsung: membolehkan belia memilih tarikh dan slot masa temu janji secara interaktif, memaparkan Pelan Tindakan Bimbingan di Papan Pemuka Belia, serta membaiki fungsi muat turun fail PDF bagi surat tawaran, surat perakuan geran, dan perjanjian sewaan.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Ketetapan Berdasarkan Jawapan Anda**:
> 1. **Pemilihan Slot Temu Janji Interaktif**: Usahawan belia tidak perlu menaip tarikh atau masa secara manual. Sebaliknya, borang temu janji menyediakan pemilih tarikh kalendar interaktif berserta grid kad slot masa bimbingan (cth: `09:00 AM - 10:00 AM`, `10:30 AM - 11:30 AM`, `02:30 PM - 03:30 PM`).
> 2. **Modul Bimbingan & Pelan Tindakan Belia**: Papan Pemuka Belia (**Merchant Portal**) kini dilengkapi sub-tab khas `mentorship` (**Bimbingan & Pelan Tindakan**). Belia boleh melihat mentor bertauliah mereka, jadual sesi klinik, minit perbincangan, serta senarai semak tugasan (action checklist) yang dihantar oleh mentor dengan kotak semakan interaktif.
> 3. **Pembaikan Muat Turun Dokumen PDF**: Menggantikan cetakan `window.print()` yang sering disekat dalam persekitaran iFrame dengan penjana fail PDF sebenar berasaskan enjin `jsPDF` untuk semua dokumen rasmi:
>    - **Surat Tawaran Kapsul Niaga** (`.pdf`)
>    - **Surat Perakuan Rasmi Geran Belia UMK** (`.pdf`)
>    - **Perjanjian Sewaan Kapsul Digital** (`.pdf`)

---

## 1. Overview & Core Concept

- **Aliran Pendaftaran & Temu Janji Mentor**:
  - Usahawan belia membuka Klinik Usahawan, melihat senarai mentor bertauliah (UMK CEED, INSKEN, SME Corp), memilih mentor yang bersesuaian, memilih tarikh melalui kalendar visual, dan memilih slot masa aktif.
  - Permohonan temu janji dihantar terus ke Papan Pemuka Mentor untuk disahkan atau ditetapkan pautan Google Meet / bilik kaunseling fizikal.
- **Kesalinghubungan Pelan Tindakan (Action Plan Synchronization)**:
  - Apabila mentor mencatat minit bimbingan dan menetapkan tugasan wajib (contohnya pendaftaran SSM, buka akaun Maybank bisnes, ujian pembungkusan retort), rekod ini serta-merta muncul di Papan Pemuka Belia di bawah modul **Bimbingan & Pelan Tindakan**.
  - Belia boleh menandakan tugasan selesai dan melihat bar peratusan kemajuan perniagaan mereka.
- **Penyelesaian Muat Turun Dokumen Rasmi**:
  - Semua butang cetak atau muat turun menjana muat turun fail `.pdf` rasmi bersaiz A4 yang lengkap dengan kepala surat, kod rujukan unik, dan cop pengesahan digital kerajaan negeri/UMK.

---

## 2. User Experience & Visual Design

- **Aliran Pemilihan Kalendar & Slot Masa**:
  - **Pemilih Tarikh Visual**: Barisan tarikh 14 hari ke hadapan dengan penunjuk hari (Ahad - Khamis) yang sepadan dengan jadual kelapangan mentor.
  - **Grid Slot Masa Interaktif**: Butang kad masa yang boleh diklik (Pagi: 09:00 AM, 10:30 AM; Petang: 02:00 PM, 03:30 PM) dengan penunjuk status hijau (tersedia) atau kelabu (penuh).
  - **Pilihan Mod**: Butang togol mod bersemuka di Kampus UMK atau Google Meet maya.
- **Sub-Modul Baharu di Papan Pemuka Belia (`mentorship`)**:
  - **Kad Mentor Saya**: Paparan profil mentor yang membimbing usahawan (nama, agensi UMK CEED, butang WhatsApp terus, dan emel).
  - **Status Sesi Bimbingan**: Tarikh temu janji seterusnya, masa, lokasi kampus atau butang "Sertai Google Meet".
  - **Pelan Tindakan Usahawan (Action Checklist)**: Senarai tugasan berstruktur dengan kotak semak interaktif, tarikh akhir sasaran, dan ulasan bimbingan mentor.
  - **Surat Perakuan Geran Saya**: Ruang melihat dan memuat turun Surat Perakuan Rasmi Geran Belia (RM3,000 / RM5,000) yang telah dikeluarkan oleh mentor.
- **Reka Bentuk Dokumen PDF Sedia Cetak**:
  - Susun atur formal 1 halaman A4 berkualiti tinggi dengan jalur warna Diraja Kelantan, lambang rasmi, maklumat usahawan & penyewa, nombor rujukan unik, dan tandatangan digital.

---

## 3. Key Product Decisions & Trade-Offs

- **Keputusan 1: Kalendar Interaktif & Grid Slot Menggantikan Input Teks Manual**
  - *Pendekatan*: Menghapuskan medan teks bebas dan senarai statik. Menyediakan pilihan tarikh kalendar dinamik dan butang kad slot masa mengikut hari kelapangan mentor.
  - *Rasional*: Mengelakkan kesilapan format tarikh, memudahkan usahawan membuat tempahan dalam beberapa klik sahaja, dan memastikan masa temu janji teratur.
- **Keputusan 2: Sub-Tab Bimbingan Khusus dalam Papan Pemuka Belia**
  - *Pendekatan*: Menambah `mentorship` ke dalam sub-navigasi Papan Pemuka Belia supaya usahawan mempunyai satu pusat sehenti memantau bimbingan dan pelan tindakan mereka.
  - *Rasional*: Mewujudkan kesalinghubungan data sebenar antara peranan Mentor dan Belia tanpa belia perlu mencari di tempat lain.
- **Keputusan 3: Penjana PDF Terus Menggunakan jsPDF Mengelakkan Sekatan iFrame**
  - *Pendekatan*: Menggunakan enjin `jsPDF` untuk memuat turun terus fail `.pdf` ke peranti pengguna secara automatik, di samping menyediakan pratonton dokumen sebelum cetakan.
  - *Rasional*: Panggilan `window.print()` sering disekat oleh keselamatan pelayar dalam persekitaran iFrame. Penjanaan fail `.pdf` menjamin muat turun 100% berjaya.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                          App.tsx                            │
│  State: mentorshipRegistrations, myBookings, myBusiness     │
│  Modals: MentorshipClinicModal, OfferLetterModal, etc.      │
└───────────────┬─────────────────────────────┬───────────────┘
                │                             │
                ▼                             ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      MerchantPortal.tsx      │ │     MentorPortal.tsx       │
│  New Sub-Tab: 'mentorship'   │ │  - Sesi Bimbingan          │
│  - Kad Mentor Berdaftar      │ │  - Keluar Perakuan Geran   │
│  - Jadual Klinik & Meet Link │ │  - Catat Minit & Tugasan   │
│  - Pelan Tindakan Interaktif │ └─────────────┬──────────────┘
│  - Surat Perakuan Geran PDF  │               │
└───────────────┬──────────────┘               │
                │                              │
                ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│           pdfGenerator.ts & Universal Document Exporters    │
│  - downloadOfferLetterPdf (Surat Tawaran Kapsul)            │
│  - downloadGrantEndorsementPdf (Perakuan Geran UMK)         │
│  - downloadTenancyAgreementPdf (Perjanjian Sewaan)          │
└─────────────────────────────────────────────────────────────┘
```

- **Aliran Data Bimbingan & Pelan Tindakan**:
  - Apabila usahawan menempah bimbingan melalui `MentorshipClinicModal`, rekod ditambah ke dalam senarai `mentorshipRegistrations` dengan status `pending` dan disimpan dalam simpanan tempatan.
  - Mentor mengesahkan permohonan, menetapkan pautan Meet atau bilik kaunseling, dan memasukkan pelan tindakan.
  - Usahawan belia yang membuka sub-tab `mentorship` di `MerchantPortal` dapat melihat nota tindakan mentor secara masa nyata dan menandakan tugasan yang telah disiapkan.
- **Penjanaan Fail PDF Universal**:
  - Fungsi eksport PDF memproses reka letak HTML dokumen rasmi bersaiz A4 (794px × 1122px), menjana kanvas beresolusi tinggi, dan menyimpannya sebagai fail `.pdf` sebenar terus ke komputer pengguna tanpa memerlukan dialog cetakan sistem yang terhad.
