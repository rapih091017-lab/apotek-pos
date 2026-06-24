# Module PRD — Kontak (Pelanggan & Dokter)
### Bagian dari: Sistem POS & ERP Apotek
Versi: 1.0 | Status: Final

---

## 1. Ringkasan & Scope

Modul ini menyimpan data pelanggan (pasien) dan dokter. Supplier/SBF sudah di modul Master Data.

✅ **Termasuk (MVP):**
- **Data Pelanggan** — nama, no HP (untuk WhatsApp), alamat, identitas dasar, status member
- **Data Dokter** — nama, nomor SIP (Surat Izin Praktik), spesialisasi
- **Import Pelanggan** — upload massal via Excel/CSV
- **Search & autocomplete** — dipakai di modul Kasir (pilih pasien saat input resep) dan modul Pelayanan nanti

❌ **Belum termasuk (menyusul):**
- Program loyalty lengkap (poin, tier, redeem) — hanya flag member + tracking dasar
- Riwayat pembelian per pelanggan di modul ini (ada di Laporan)
- Integrasi WhatsApp API untuk blast pesan

---

## 2. Dependency

Modul ini **tidak bergantung** ke modul lain — murni CRUD.

Modul yang bergantung ke Kontak:
- **Kasir** → `sales_transactions.pelanggan_id`, `prescriptions.pasien_id`, `prescriptions.dokter_id`
- **Pelayanan (nanti)** → resep terhubung ke pasien & dokter
- **Laporan** → insight pelanggan loyal, rate pemakaian obat per dokter
- **Marketing** → follow-up pelanggan, template WA

---

## 3. Role & Hak Akses

| Aksi | Kasir | Admin (Apoteker) | Owner |
|---|---|---|---|
| Lihat daftar pelanggan | ✅ | ✅ | ✅ |
| Lihat daftar dokter | ✅ | ✅ | ✅ |
| Tambah pelanggan baru | ✅ (saat input resep) | ✅ | ✅ |
| Edit pelanggan | ❌ | ✅ | ✅ |
| Tambah/edit dokter | ❌ | ✅ | ✅ |
| Import massal pelanggan | ❌ | ✅ | ✅ |
| Hapus data | ❌ | ❌ | ✅ |

---

## 4. Skema Data (Backend)

### 4.1 `contacts` — Tabel Tunggal Pelanggan + Dokter

Menggunakan satu tabel dengan kolom spesifik yang nullable sesuai tipe.

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | |
| tipe | enum | `pelanggan`, `dokter` |
| kode | varchar(50) | Auto-generate: `PEL-{6digit}` atau `DOK-{6digit}` |
| nama | varchar(200) | Nama lengkap |
| no_hp | varchar(30), nullable | Nomor HP/WhatsApp |
| email | varchar(100), nullable | |
| alamat | text, nullable | |
| tanggal_lahir | date, nullable | Untuk data pasien |
| jenis_kelamin | enum, nullable | `pria`, `wanita` |

**Kolom khusus Dokter (nullable, hanya diisi jika tipe=dokter):**

| Kolom | Tipe | Keterangan |
|---|---|---|
| no_sip | varchar(50), nullable | Nomor Surat Izin Praktik |
| spesialisasi | varchar(100), nullable | Mis. "Dokter Umum", "Dokter Anak", "Dokter Kulit" |
| institusi | varchar(200), nullable | Rumah sakit / klinik tempat praktik |

**Kolom khusus Pelanggan (nullable, hanya diisi jika tipe=pelanggan):**

| Kolom | Tipe | Keterangan |
|---|---|---|
| member_status | enum, nullable | `biasa`, `member` (default: `biasa`) |
| poin | integer, default 0 | Akumulasi poin (MVP: track only, no redeem) |
| tanggal_bergabung | date, nullable | Tanggal terdaftar |

**Kolom umum:**
| Kolom | Tipe | Keterangan |
|---|---|---|
| catatan | text, nullable | |
| is_aktif | boolean, default true | Soft delete |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Index:**
- UNIQUE(tenant_id, kode)
- INDEX(tenant_id, tipe)
- INDEX(tenant_id, nama) — untuk search
- INDEX(tenant_id, no_hp) — untuk search by HP

---

## 5. Business Rules

1. **`kode` auto-generate:** `PEL-{6digit}` untuk pelanggan, `DOK-{6digit}` untuk dokter
2. **Search di Kasir** mencari `nama` dan `no_hp` (ILIKE / full-text search)
3. **Kasir bisa tambah pelanggan baru on-the-fly** saat input resep (via tombol "Pelanggan Baru" di flow resep). Data minimal: nama + no_hp. Sisa data bisa dilengkapi nanti
4. **No HP bisa dikosongkan** — tidak semua pelanggan kasih no HP
5. **Dokter tidak bisa dihapus** jika sudah terkait resep — hanya dinonaktifkan
6. **Pelanggan tidak bisa dihapus** jika sudah punya transaksi — hanya dinonaktifkan
7. **Import massal:** duplikasi dideteksi berdasarkan `no_hp` (jika ada) atau `nama + tanggal_lahir`

---

## 6. Alur Pengguna (Frontend Flow)

### 6.1 Struktur Halaman

```
┌─────────────────────────────────────────────────────────┐
│  TOP BAR                                                │
├──────────┬──────────────────────────────────────────────┤
│ SIDEBAR  │  KONTEN UTAMA                                │
│          │                                              │
│ 👥 Pelang│  [Tabel pelanggan / form slide-over]        │
│ 🏥 Dokter │                                              │
│ 📥 Import │                                              │
└──────────┴──────────────────────────────────────────────┘
```

### 6.2 Daftar Pelanggan (Tab default)

**Tabel:** Kode, Nama, No HP, Alamat, Member Status (badge), Total Transaksi, Terakhir Transaksi, Aksi

| Kode | Nama | No HP | Member | Total Transaksi | Terakhir | Aksi |
|------|------|-------|--------|----------------|----------|------|
| PEL-000001 | Budi Santoso | 08123456789 | ⭐ Member | 12 transaksi | 19 Jun | [Edit] |
| PEL-000002 | Siti Aminah | 08567890123 | Biasa | 3 transaksi | 15 Jun | [Edit] |

- Search: by nama, no HP, kode
- Filter: member status (semua/member/biasa)
- Klik baris → form edit slide-over

### 6.3 Form Pelanggan (Slide-over)

```
┌──────────────────────────────────────────┐
│  ← Tutup      Pelanggan Baru / Edit      │
│  ────────────────────────────────────── │
│                                          │
│  Kode          [PEL-000001]             │
│  Nama *        [Budi Santoso          ] │
│  No HP         [08123456789           ] │
│  Email         [budi@email.com        ] │
│  Alamat        [Jl. Sehat No. 12      ] │
│  Tgl Lahir     [15/03/1985]            │
│  Jenis Kelamin [○ Pria  ○ Wanita]      │
│                                          │
│  Status Member [▾ Biasa / Member]       │
│  Poin          [120]                    │
│                                          │
│  ┌──────────┐    ┌────────────────────┐ │
│  │  Batal   │    │   💾 Simpan       │ │
│  └──────────┘    └────────────────────┘ │
└──────────────────────────────────────────┘
```

### 6.4 Daftar Dokter (Tab)

**Tabel:** Kode, Nama, No SIP, Spesialisasi, Institusi, No HP, Aksi

### 6.5 Form Dokter (Slide-over)

Mirip pelanggan, dengan field tambahan: No SIP, Spesialisasi, Institusi.

### 6.6 Import Pelanggan (Tab)

```
┌──────────────────────────────────────────┐
│  IMPORT PELANGGAN                        │
│  ────────────────────────────────────── │
│                                          │
│  1. 📥 Download Template Excel          │
│                                          │
│  2. 📤 Upload file yang sudah diisi     │
│     ┌──────────────────────────────────┐ │
│     │  Drag & drop file Excel/CSV      │ │
│     │           atau                   │ │
│     │     [Pilih File]                 │ │
│     └──────────────────────────────────┘ │
│                                          │
│  3. Preview & Validasi                  │
│     ┌──────────────────────────────────┐ │
│     │ ✓ 120 baris valid                │ │
│     │ ⚠ 3 baris error (duplikat/no HP │ │
│     │     tidak valid)                 │ │
│     │     [Lihat Detail Error]         │ │
│     └──────────────────────────────────┘ │
│                                          │
│  4. [Import 120 Pelanggan]              │
└──────────────────────────────────────────┘
```

---

## 7. Build Prompt (Siap Pakai)

```
Saya sedang membangun modul "Kontak (Pelanggan & Dokter)" untuk aplikasi POS apotek
berbasis web, multi-tenant SaaS, menggunakan [STACK]. Database: PostgreSQL (Supabase).

KONTEKS:
- Multi-tenant: semua tabel wajib tenant_id + RLS
- 3 role: owner, admin, kasir
- Data supplier sudah ada di modul Master Data

TUGAS:

1. SKEMA DATABASE
   Buat migration untuk tabel `contacts` dengan struktur lengkap sesuai PRD Bagian 4.
   Gunakan satu tabel dengan tipe enum (pelanggan/dokter) + kolom nullable spesifik.

   RLS policy:
   - Kasir: SELECT, INSERT (pelanggan saja, untuk input on-the-fly saat resep)
   - Admin/Owner: full CRUD

2. BACKEND LOGIC
   - CRUD contacts (create, read, update, soft-delete/toggle is_aktif)
   - Search: ILIKE by nama, no_hp, kode
   - Filter: by tipe, member_status
   - Auto-generate kode: PEL-{6digit} atau DOK-{6digit}
   - Import massal CSV/Excel dengan validasi duplikasi (no_hp atau nama+tgl_lahir)
   - Endpoint untuk autocomplete (dipakai Kasir): GET /contacts/search?q=...

3. FRONTEND
   - Layout admin: sidebar (Pelanggan, Dokter, Import)
   - Tabel pelanggan: search, filter member, kolom lengkap, klik → form
   - Tabel dokter: sama, kolom spesifik
   - Form slide-over: edit/add, field sesuai tipe
   - Halaman import: download template → upload → preview validasi → import

MULAI DARI:
a) Skema database + migration
b) CRUD endpoints
c) Frontend tabel & form
```

---

## 8. Catatan Integrasi

- **Modul Kasir** akan membaca `contacts` via autocomplete endpoint untuk input pasien & dokter saat flow resep
- **Modul Pelayanan** akan membaca `contacts` untuk menghubungkan resep ke pasien & dokter (FK `pasien_id` dan `dokter_id` di `prescriptions`)
- **Laporan** akan JOIN `contacts` dengan `sales_transactions` untuk insight pelanggan loyal
