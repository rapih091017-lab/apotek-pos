# Module PRD — Pelayanan (Resep & Racikan)
### Bagian dari: Sistem POS & ERP Apotek
Versi: 1.0 | Status: Final

---

## 1. Ringkasan & Scope

Modul ini adalah pusat pengelolaan resep — dari input resep, pelacakan penebusan (penuh/sebagian), hingga template racikan untuk mempercepat input obat campuran.

✅ **Termasuk (MVP):**
- **Penerimaan Resep** — input lengkap resep (pasien, dokter, daftar obat dengan dosis & aturan pakai, foto resep)
- **Penebusan Resep** — lacak status penebusan (belum/sebagian/lunas), lihat sisa yang belum ditebus
- **Daftar Resep** — semua resep, filter by status, pasien, tanggal
- **Template Racikan** — master komposisi racikan yang sering dipakai (obat + qty per racikan + tuslah default)

❌ **Belum termasuk (menyusul):**
- Alur racikan di Kasir (checkout racikan = kurangi stok komponen + tambah tuslah) — ini di modul Kasir nanti saat fitur racikan diaktifkan
- Upload foto resep via OCR untuk auto-fill data
- Etiket obat racikan (cetak label terpisah)

---

## 2. Dependency

Modul ini bergantung ke:
- **Kontak** → `contacts` untuk pasien & dokter
- **Master Data** → `products`, `product_units` untuk item resep & komponen racikan
- **Kasir** → tabel `prescriptions` & `prescription_items` (di-expand disini)

Modul yang bergantung ke Pelayanan:
- **Kasir** → membaca resep saat "Tambah dari Resep" di keranjang
- **Laporan** → pelacakan obat keras/narkotika via resep

---

## 3. Role & Hak Akses

| Aksi | Kasir | Admin (Apoteker) | Owner |
|---|---|---|---|
| Lihat daftar resep | ✅ | ✅ | ✅ |
| Input resep baru | ✅ | ✅ | ✅ |
| Edit resep (sebelum ada transaksi) | ❌ | ✅ | ✅ |
| Hapus resep (belum ada transaksi) | ❌ | ✅ | ✅ |
| Upload foto resep | ✅ | ✅ | ✅ |
| Kelola template racikan | ❌ | ✅ | ✅ |

---

## 4. Skema Data (Backend)

### 4.1 `prescriptions` — Resep (Expand dari modul Kasir)

Kolom yang SUDAH ADA di modul Kasir tetap dipertahankan. Kolom baru ditandai ⭐.

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | |
| outlet_id | uuid | FK ke outlets ⭐ |
| nomor_resep | varchar(50) | Auto: `RX-{tenant_prefix}-{6digit}` ⭐ |
| pasien_id | uuid | FK ke contacts (tipe=pelanggan) |
| dokter_id | uuid, nullable | FK ke contacts (tipe=dokter) |
| tanggal_resep | date | Tanggal resep ditulis dokter |
| status | enum | `belum_ditebus`, `sebagian`, `lunas` |
| foto_url | text, nullable | Upload foto resep ⭐ |
| catatan_dokter | text, nullable | Instruksi khusus dari dokter ⭐ |
| created_by | uuid | FK ke users |
| created_at | timestamptz | |

### 4.2 `prescription_items` — Item Resep (Expand)

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | ⭐ |
| prescription_id | uuid | FK |
| product_id | uuid | FK ke products |
| product_unit_id | uuid | FK ke product_units ⭐ (satuan resep) |
| qty_diresepkan | numeric | Jumlah yang diresepkan |
| qty_sudah_ditebus | numeric, default 0 | Akumulasi yang sudah diambil |
| dosis_per_hari | varchar(100), nullable | "3×1 tablet", "2×1 kapsul" ⭐ |
| aturan_pakai | text, nullable | "Sesudah makan", "Sebelum tidur" ⭐ |
| is_racikan | boolean, default false | Flag item ini racikan ⭐ |
| template_racikan_id | uuid, nullable | FK ke template_racikan ⭐ |
| catatan | text, nullable | ⭐ |

### 4.3 `template_racikan` — Master Template Racikan

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | |
| nama | varchar(200) | Nama template, mis. "Racikan Asma", "Puyer Demam" |
| deskripsi | text, nullable | Keterangan |
| tuslah_default | numeric, default 0 | Biaya jasa racikan default (bisa di-override per transaksi) |
| is_aktif | boolean, default true | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### 4.4 `template_racikan_items` — Komponen Racikan

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | |
| template_id | uuid | FK ke template_racikan |
| product_id | uuid | FK ke products (komponen obat) |
| product_unit_id | uuid | FK ke product_units |
| qty | numeric | Jumlah komponen per 1 racikan (dalam satuan unit_id) |
| catatan | text, nullable | |

### 4.5 `tuslah_config` — Konfigurasi Biaya Tuslah

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid, nullable | NULL = default global |
| nama | varchar(100) | "Tuslah Standar", "Tuslah Narkotika/Psikotropika" |
| biaya | numeric | Biaya per racikan |
| is_default | boolean, default false | |

---

## 5. Business Rules

### 5.1 Resep
1. `nomor_resep` auto-generate: `RX-{prefix}-{6digit}`
2. Resep yang belum punya transaksi (`qty_sudah_ditebus = 0` di semua item) **bisa diedit/dihapus**
3. Resep yang sudah punya transaksi **tidak bisa diedit** — hanya bisa lihat & lacak status
4. Status resep otomatis:
   - Semua item `qty_sudah_ditebus = 0` → `belum_ditebus`
   - Sebagian item `qty_sudah_ditebus > 0` tapi `< qty_diresepkan` → `sebagian`
   - Semua item `qty_sudah_ditebus = qty_diresepkan` → `lunas`
5. `foto_url` di-upload & di-resize max 800px. Format: JPG/PNG/WebP

### 5.2 Penebusan
1. Penebusan terjadi di modul Kasir (flow "Tambah dari Resep") — modul Pelayanan hanya menampilkan status & riwayat
2. Penebusan sebagian: pasien bisa ambil 5 dari 10 tablet diresepkan, sisa 5 bisa ditebus lain hari
3. Penebusan obat keras/narkotika WAJIB lewat Admin (validasi apoteker) — sudah diimplementasi di Kasir

### 5.3 Template Racikan
1. Template racikan = komposisi obat yang sering diracik bersama
2. `tuslah_default` bisa di-override oleh `tuslah_config` atau manual saat transaksi
3. Template bisa dipilih saat input resep untuk mempercepat entri
4. Begitu template dipilih → semua komponen template otomatis ditambahkan ke `prescription_items` dengan `is_racikan = true`

### 5.4 Tuslah
1. Tuslah = biaya jasa peracikan obat (pencampuran beberapa obat jadi satu)
2. Default tuslah bisa diatur per template racikan atau per tenant di `tuslah_config`
3. Untuk MVP: tuslah ditambahkan sebagai item terpisah di keranjang kasir, bukan bagian dari harga produk. Detail implementasi checkout racikan di modul Kasir saat fitur racikan diaktifkan
4. `tuslah_config` dipakai sebagai referensi biaya. Tenant bisa punya multiple tier tuslah (standar, narkotika, dll.)

---

## 6. Alur Pengguna (Frontend Flow)

### 6.1 Struktur Halaman

```
┌─────────────────────────────────────────────────────────┐
│  TOP BAR                                                │
├──────────┬──────────────────────────────────────────────┤
│ SIDEBAR  │  KONTEN UTAMA                                │
│          │                                              │
│ 📋 Daftar│  [Tabel resep / detail resep]               │
│   Resep  │                                              │
│ 🧪 Templt│  [Tabel template racikan / form template]   │
│   Racikan│                                              │
│ ⚙️ Tuslah │  [Konfigurasi biaya tuslah]                │
└──────────┴──────────────────────────────────────────────┘
```

### 6.2 Daftar Resep (Tab Utama)

**Tabel:** No Resep, Pasien, Dokter, Tanggal, Jml Item, Status (badge), Progres, Aksi

| No Resep | Pasien | Dokter | Tgl | Item | Status | Progres | Aksi |
|----------|--------|--------|-----|------|--------|---------|------|
| RX-000001 | Budi S. | Dr. Andi | 19 Jun | 3 | Sebagian | ████░░ 2/3 | [Detail] |
| RX-000002 | Siti A. | Dr. Ratna | 18 Jun | 2 | Lunas | ██████ 2/2 | [Detail] |
| RX-000003 | Dewi L. | Dr. Hendra | 17 Jun | 1 | Belum | ░░░░░░ 0/1 | [Edit] [Detail] |

- Search by: nomor resep, nama pasien, nama dokter
- Filter: status, tanggal
- Klik baris → detail resep

### 6.3 Detail Resep

```
┌──────────────────────────────────────────┐
│  Detail Resep — RX-000001                │
│  ────────────────────────────────────── │
│                                          │
│  Pasien:     Budi Santoso ✏️            │
│  Dokter:     Dr. Andi Wijaya            │
│  Tgl Resep:  19 Juni 2026               │
│  Status:     🟡 Sebagian (2/3 ditebus)  │
│  ────────────────────────────────────── │
│                                          │
│  📎 Foto Resep: [Lihat] (1 foto)        │
│                                          │
│  📋 Item Resep:                         │
│  ┌────────────────────────────────────┐ │
│  │ ✓ Paracetamol 500mg               │ │
│  │   Diresepkan: 10 tab | Ditebus: 10 │ │ ← Lunas
│  │   Dosis: 3×1 tablet | Sesudah makan│ │
│  ├────────────────────────────────────┤ │
│  │ ◐ Amoxicillin 500mg               │ │
│  │   Diresepkan: 15 kaps | Ditebus: 5│ │ ← Sebagian
│  │   Dosis: 2×1 kapsul | Sebelum tidur│ │
│  ├────────────────────────────────────┤ │
│  │ ○ OBH Combi                       │ │
│  │   Diresepkan: 1 botol | Ditebus: 0│ │ ← Belum
│  │   Dosis: 3×1 sendok takar         │ │
│  └────────────────────────────────────┘ │
│                                          │
│  Riwayat Penebusan:                     │
│  ┌────────────────────────────────────┐ │
│  │ 19 Jun 14:32 — TRX-042 — 5 tab +  │ │
│  │   10 kaps — Kasir A               │ │
│  │ 16 Jun 11:20 — TRX-035 — 5 tab    │ │
│  │   — Kasir B                       │ │
│  └────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

### 6.4 Template Racikan (Tab)

**Tabel:** Nama Template, Jml Komponen, Tuslah Default, Dipakai (kali), Status, Aksi

| Nama | Komponen | Tuslah | Dipakai | Aksi |
|------|----------|--------|---------|------|
| Puyer Demam Anak | 3 obat | Rp 5.000 | 12× | [Edit] [Nonaktifkan] |
| Racikan Asma | 4 obat | Rp 7.500 | 8× | [Edit] |
| Salep Kulit | 2 obat | Rp 3.000 | 3× | [Edit] |

### 6.5 Form Template Racikan (Slide-over)

```
┌──────────────────────────────────────────┐
│  Template Racikan Baru / Edit            │
│  ────────────────────────────────────── │
│  Nama *          [Puyer Demam Anak    ] │
│  Deskripsi       [Untuk demam & batuk ] │
│  Tuslah Default  Rp [5.000]    /racikan │
│                                          │
│  Komponen Racikan:                       │
│  ┌────────────────────────────────────┐ │
│  │ [+ Tambah Obat]                    │ │
│  ├────────────────────────────────────┤ │
│  │ Paracetamol 500mg                  │ │
│  │ Qty: [250] mg   ✕                 │ │
│  ├────────────────────────────────────┤ │
│  │ CTM 4mg                            │ │
│  │ Qty: [2] mg     ✕                 │ │
│  ├────────────────────────────────────┤ │
│  │ Guaifenesin                        │ │
│  │ Qty: [50] mg    ✕                 │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌──────────┐    ┌────────────────────┐ │
│  │  Batal   │    │   💾 Simpan       │ │
│  └──────────┘    └────────────────────┘ │
└──────────────────────────────────────────┘
```

### 6.6 Konfigurasi Tuslah (Tab)

**Tabel:** Nama, Biaya, Default, Aksi

| Nama | Biaya | Default | Aksi |
|------|-------|---------|------|
| Tuslah Standar | Rp 5.000 | ✅ | [Edit] |
| Tuslah Narkotika/Psiko | Rp 10.000 | | [Edit] |

---

## 7. Build Prompt (Siap Pakai)

```
Saya sedang membangun modul "Pelayanan (Resep & Racikan)" untuk aplikasi POS apotek
berbasis web, multi-tenant SaaS, menggunakan [STACK]. Database: PostgreSQL (Supabase).

KONTEKS:
- Multi-tenant: semua tabel wajib tenant_id + RLS
- 3 role: owner, admin, kasir
- Tabel prescriptions & prescription_items SUDAH ADA dari modul Kasir
- Tabel contacts (pasien & dokter) SUDAH ADA dari modul Kontak
- Tabel products, product_units SUDAH ADA dari modul Master Data

TUGAS:

1. **MIGRASI DATABASE** — ALTER table yang sudah ada + CREATE table baru
   a. ALTER TABLE prescriptions:
      - Tambah kolom: outlet_id, nomor_resep, foto_url, catatan_dokter
      - Auto-generate nomor_resep: RX-{prefix}-{6digit}
   b. ALTER TABLE prescription_items:
      - Tambah kolom: tenant_id, product_unit_id, dosis_per_hari, aturan_pakai,
        is_racikan, template_racikan_id, catatan
   c. CREATE TABLE template_racikan
   d. CREATE TABLE template_racikan_items
   e. CREATE TABLE tuslah_config
   (Ikuti skema di PRD Bagian 4.)

   RLS policy:
   - Kasir: SELECT + INSERT prescriptions & items (saat input resep)
   - Admin/Owner: full CRUD termasuk template racikan & tuslah config
   - Tidak ada yang bisa hard-delete resep yang sudah punya transaksi

2. **BACKEND LOGIC**
   - CRUD prescriptions + prescription_items
   - Auto-update status resep via trigger/function (belum/sebagian/lunas)
   - CRUD template_racikan + items
   - Endpoint: GET /prescriptions?status=&pasien_id=&tanggal_mulai=&tanggal_akhir=
   - Endpoint: GET /prescriptions/:id/detail (include items + riwayat penebusan)
   - Upload foto resep (max 2MB, resize ke 800px, format JPG/PNG/WebP)
   - CRUD tuslah_config

3. **FRONTEND**
   a. **Daftar Resep** — tabel dengan search (nomor, pasien, dokter), filter status,
      progress bar penebusan, klik → detail
   b. **Detail Resep** — informasi lengkap + daftar item dengan status per item
      (lunas/sebagian/belum) + riwayat penebusan (JOIN sales_transactions)
   c. **Form Resep Baru** (mirip flow di Kasir tapi lebih lengkap):
      - Pilih pasien (autocomplete dari contacts)
      - Pilih dokter (autocomplete)
      - Upload foto resep
      - Input item: search produk → pilih satuan → input qty → dosis → aturan pakai
      - Pilih template racikan (jika ada) → komponen otomatis terisi
   d. **Template Racikan** — tabel + form slide-over (nama, tuslah, komponen list)
   e. **Konfigurasi Tuslah** — CRUD sederhana

MULAI DARI:
a) Migration (ALTER + CREATE tables)
b) Backend CRUD + auto-status trigger
c) Frontend
```

---

## 8. Catatan Integrasi

- **Ke modul Kasir:** Kasir sudah membaca prescriptions & prescription_items untuk flow "Tambah dari Resep". Update qty_ditebus dilakukan di endpoint checkout Kasir.
- **Aktivasi racikan di Kasir:** Saat fitur racikan diaktifkan, checkout racikan = kurangi stok semua komponen dari template + tambah biaya tuslah. Belum diimplementasi di MVP.
- **Ke modul Laporan:** Data resep menjadi sumber laporan obat keras/narkotika (SIPNAP) dan analisa rate pemakaian obat per dokter.
