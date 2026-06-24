# Module PRD — Master Data
### Bagian dari: Sistem POS & ERP Apotek
Versi: 1.0 | Status: Final

---

## 1. Ringkasan & Scope

Modul ini adalah fondasi data seluruh sistem. Semua modul lain (Kasir, Pembelian, Persediaan, Resep, Laporan) bergantung ke struktur data yang didefinisikan di sini.

✅ **Termasuk (MVP):**
- **Master Produk** — data obat & barang lengkap dengan atribut farmasi (nama dagang, nama generik, golongan, satuan dasar, harga, produsen, dll.)
- **Kategori Produk** — hierarki kategori (obat bebas, obat keras, vitamin, alkes, dll.)
- **Satuan & Konversi** — satu produk bisa punya banyak satuan dengan konversi antar satuan (1 box = 10 strip = 100 tablet)
- **Golongan Obat** — klasifikasi regulasi farmasi (bebas, bebas terbatas, keras, narkotika, psikotropika, prekursor, vitamin) + flag konsinyasi
- **Supplier / PBF** — data pemasok dengan atribut dasar
- **Barcode** — dukungan multi-barcode per produk (barcode pabrik + barcode internal apotek sendiri)
- **Import Produk** — upload massal via Excel/CSV

❌ **Belum termasuk (menyusul):**
- Produk Bundling (paket gabungan) → modul Promo / Marketing
- Master Rak & Master Gudang → modul Persediaan
- Jenis Pembayaran → sudah didefinisikan di modul Kasir
- Harga bertingkat (eceran/grosir) → tidak untuk MVP (cukup 1 harga jual)
- Detail Supplier lengkap (sales rep, terms kredit, tempo) → Fase 2

---

## 2. Keputusan Final (Dari Diskusi dengan User)

| # | Topik | Keputusan |
|---|-------|-----------|
| 1 | Multi-satuan | **Ya** — 1 produk bisa punya banyak satuan dengan konversi (1 box = 10 strip = 100 tablet). Satuan "dasar" untuk stok vs satuan "jual" untuk transaksi |
| 2 | Harga bertingkat | **Tidak untuk MVP** — cukup 1 harga jual per produk (`harga_jual`) |
| 3 | Barcode | **Dua-duanya** — barcode pabrik (dari kemasan asli) + barcode internal (bisa di-generate/di-assign sendiri oleh apotek) |
| 4 | Golongan obat | **8 golongan**: bebas, bebas terbatas, keras, narkotika, psikotropika, prekursor, vitamin + flag `is_konsinyasi` (barang titipan, bukan golongan obat tapi flag bisnis) |
| 5 | Supplier/PBF | **Data dasar** — nama, kontak, alamat, no. izin PBF. Detail lanjutan (sales rep, terms kredit, tempo pembayaran) menyusul |

---

## 3. Role & Hak Akses

| Aksi | Kasir | Admin (Apoteker) | Owner |
|---|---|---|---|
| Lihat daftar produk | ✅ | ✅ | ✅ |
| Lihat detail produk | ✅ | ✅ | ✅ |
| Tambah produk baru | ❌ | ✅ | ✅ |
| Edit produk | ❌ | ✅ | ✅ |
| Nonaktifkan produk (soft delete) | ❌ | ✅ | ✅ |
| Hapus permanen produk | ❌ | ❌ | ✅ |
| Import produk massal | ❌ | ✅ | ✅ |
| Kelola kategori | ❌ | ✅ | ✅ |
| Kelola satuan | ❌ | ✅ | ✅ |
| Kelola supplier | ❌ | ✅ | ✅ |
| Ubah harga jual | ❌ | ✅ | ✅ |

---

## 4. Skema Data (Backend)

> Semua tabel punya `tenant_id` untuk isolasi multi-tenant + RLS. Semua `id` bertipe `uuid`.

### 4.1 `products` — Master Produk

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK ke tenants |
| kode_produk | varchar(50) | SKU internal, unique per tenant, bisa auto-generate |
| nama_dagang | varchar(200) | Nama brand/dagang (mis. Panadol, Bodrex) |
| nama_generik | varchar(200) | Nama generik/zat aktif (mis. Paracetamol) |
| kategori_id | uuid | FK ke product_categories |
| satuan_dasar_id | uuid | FK ke units — satuan untuk stok (tablet, botol, dll.) |
| golongan | enum | `bebas`, `bebas_terbatas`, `keras`, `narkotika`, `psikotropika`, `prekursor`, `vitamin` |
| is_konsinyasi | boolean, default false | Flag barang titipan (konsinyasi) |
| harga_beli | numeric | Harga beli terakhir (di-update tiap faktur pembelian) |
| harga_jual | numeric | Harga jual eceran |
| het | numeric, nullable | Harga Eceran Tertinggi (jika diatur pemerintah) |
| produsen | varchar(200) | Nama pabrik/produsen |
| deskripsi | text, nullable | |
| gambar_url | text, nullable | URL gambar/foto produk |
| margin_persen | numeric, nullable | Margin % (bisa dihitung otomatis dari harga beli vs jual) |
| stok_minimum | integer, default 0 | Threshold untuk peringatan defecta |
| stok_maksimum | integer, default 0 | 0 = tidak ada batas maks |
| rata_rata_penjualan_harian | numeric, nullable | Rata-rata penjualan per hari — input manual berdasarkan data historis atau info perusahaan. Dipakai untuk kalkulasi urgency defecta (stok habis dalam X hari vs lead time supplier) |
| is_aktif | boolean, default true | Soft delete |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Index:**
- UNIQUE(tenant_id, kode_produk)
- INDEX(tenant_id, nama_dagang) untuk search
- INDEX(tenant_id, golongan) untuk filter
- INDEX(tenant_id, kategori_id) untuk filter

### 4.2 `product_categories` — Kategori Produk

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | |
| nama | varchar(100) | Nama kategori |
| parent_id | uuid, nullable | FK ke self (untuk subkategori) |
| deskripsi | text, nullable | |
| urutan | integer, default 0 | Urutan tampilan |
| created_at | timestamptz | |

### 4.3 `units` — Master Satuan

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | |
| nama | varchar(50) | Nama satuan (Tablet, Strip, Box, Botol, dll.) |
| singkatan | varchar(20) | Singkatan (tab, str, box, btl) |
| deskripsi | text, nullable | |
| created_at | timestamptz | |

### 4.4 `product_units` — Satuan per Produk (Konversi)

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | |
| product_id | uuid | FK ke products |
| unit_id | uuid | FK ke units |
| konversi_ke_dasar | numeric | Faktor konversi ke satuan dasar produk. Contoh: `1` jika ini satuan dasar, `10` jika 1 strip = 10 tablet, `100` jika 1 box = 100 tablet |
| is_satuan_dasar | boolean, default false | Hanya 1 per produk |
| is_satuan_jual_default | boolean, default false | Satuan default untuk penjualan di kasir |
| barcode | varchar(100), nullable | Barcode khusus untuk satuan ini (opsional) |
| created_at | timestamptz | |

**Rule:** Satu produk wajib punya tepat 1 baris dengan `is_satuan_dasar = true`. Satuan dasar ini yang dipakai untuk pencatatan stok di `product_batches`.

**Contoh data:**

| product | unit | konversi_ke_dasar | is_satuan_dasar | is_satuan_jual_default |
|---------|------|-------------------|-----------------|------------------------|
| Amoxicillin | Tablet | 1 | true | false |
| Amoxicillin | Strip | 10 | false | true |
| Amoxicillin | Box | 100 | false | false |
| OBH Combi | Botol | 1 | true | true |

### 4.5 `product_barcodes` — Barcode per Produk

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | |
| product_id | uuid | FK ke products |
| barcode | varchar(100) | Kode barcode |
| tipe | enum | `pabrik` (dari kemasan pabrik), `internal` (dibuat sendiri oleh apotek) |
| product_unit_id | uuid, nullable | FK ke product_units (barcode ini spesifik untuk satuan tertentu) |
| is_primary | boolean, default false | Barcode utama untuk pencarian di kasir |
| created_at | timestamptz | |

**Index:** UNIQUE(tenant_id, barcode) — satu barcode tidak boleh dipakai 2 produk berbeda dalam 1 tenant.

### 4.6 `suppliers` — Supplier / PBF

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | |
| kode | varchar(50) | Kode supplier, unique per tenant |
| nama | varchar(200) | Nama supplier/PBF |
| tipe | enum | `pbf`, `supplier_umum` |
| no_izin_pbf | varchar(100), nullable | Nomor izin PBF (wajib jika tipe=pbf) |
| alamat | text, nullable | |
| kota | varchar(100), nullable | |
| telepon | varchar(30), nullable | |
| email | varchar(100), nullable | |
| contact_person | varchar(100), nullable | Nama kontak person |
| is_aktif | boolean, default true | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### 4.7 `product_suppliers` — Relasi Produk ↔ Supplier (Junction)

Menghubungkan produk dengan supplier yang memasoknya, plus **lead time** per pasangan produk-supplier untuk kalkulasi urgency defecta.

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | |
| product_id | uuid | FK ke products |
| supplier_id | uuid | FK ke suppliers |
| lead_time_hari | integer, nullable | Estimasi waktu (hari) dari order ke barang diterima. Input manual berdasarkan data historis. Dipakai di defecta: jika sisa stok < lead time × rata_rata_penjualan → harus segera order |
| is_supplier_utama | boolean, default false | Supplier utama untuk produk ini (hanya 1 per produk) |
| catatan | text, nullable | Keterangan tambahan |
| created_at | timestamptz | |

**Index:**
- UNIQUE(tenant_id, product_id, supplier_id)
- INDEX(tenant_id, product_id) — untuk cari semua supplier produk tertentu

**Rule:**
- `is_supplier_utama = true` hanya boleh 1 per produk
- `lead_time_hari` dipakai di defecta untuk menghitung: *"stok akan habis dalam X hari, lead time Y hari → order sekarang / besok / minggu depan"*

### 4.8 Tabel Referensi: `drug_classifications` (Shared — bukan per tenant)

Tabel ini **global**, bukan per-tenant. Semua tenant pakai klasifikasi yang sama.

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | int | PK, auto-increment |
| kode | varchar(30) | `bebas`, `bebas_terbatas`, `keras`, `narkotika`, `psikotropika`, `prekursor`, `vitamin` |
| nama | varchar(50) | Nama lengkap |
| warna_badge | varchar(7) | Hex color untuk badge di UI |
| deskripsi | text, nullable | |

**Data awal (seed):**

| kode | nama | warna_badge |
|------|------|-------------|
| bebas | Obat Bebas | #16A34A |
| bebas_terbatas | Obat Bebas Terbatas | #2563EB |
| keras | Obat Keras | #DC2626 |
| narkotika | Narkotika | #7C3AED |
| psikotropika | Psikotropika | #EA580C |
| prekursor | Prekursor | #CA8A04 |
| vitamin | Vitamin / Suplemen | #0891B2 |

---

## 5. Business Rules

### 5.1 Produk
1. `kode_produk` auto-generate jika kosong: format `PROD-{tenant_prefix}-{6-digit}` (mis. `PROD-A01-000042`)
2. `harga_jual` wajib > `harga_beli` (validasi di backend). Jika user input HET, `harga_jual` ≤ HET (warning saja, tidak hard-block)
3. `gambar_url` maks 1 gambar per produk — di-resize jadi 400px di backend saat upload
4. Produk yang sudah pernah dipakai di transaksi **tidak bisa dihapus permanen** — hanya bisa di-nonaktifkan (`is_aktif = false`)
5. Produk nonaktif tetap muncul di histori/riwayat transaksi lama, tapi tidak muncul di search kasir atau dropdown input transaksi baru

### 5.2 Satuan & Konversi
1. Setiap produk **wajib** punya minimal 1 `product_units` dengan `is_satuan_dasar = true`
2. `is_satuan_dasar = true` hanya boleh 1 per produk
3. `is_satuan_jual_default = true` hanya boleh 1 per produk
4. Konversi dihitung relatif ke satuan dasar. Contoh: jika satuan dasar = tablet, maka 1 strip = 10 berarti `konversi_ke_dasar = 10` (1 strip setara 10 tablet)
5. Saat stok diinput di modul Pembelian, stok selalu disimpan dalam **satuan dasar**. Kasir tetap bisa melihat & menjual dalam **satuan jual** apapun — sistem yang mengkonversi otomatis

### 5.3 Barcode
1. Satu barcode hanya untuk 1 produk dalam 1 tenant (UNIQUE constraint)
2. `is_primary = true` hanya 1 per produk — barcode ini yang jadi hasil pertama saat scan di kasir
3. Barcode internal auto-generate jika diminta: format `{tenant_prefix}{7-digit}` (EAN-13 compatible)

### 5.4 Golongan Obat
1. Golongan `narkotika` dan `psikotropika` memicu aturan validasi ketat di modul Kasir & Pembelian (audit trail wajib, wajib resep, wajib validasi Admin)
2. Golongan `keras` wajib resep — tidak bisa dijual bebas tanpa resep
3. Golongan `bebas`, `bebas_terbatas`, `vitamin` — bisa dijual langsung tanpa resep

### 5.5 Konsinyasi
1. `is_konsinyasi = true` → produk ini stoknya milik supplier, bukan milik apotek
2. Saat terjual di kasir, sistem mencatat quantity yang terjual → nanti di modul Konsinyasi (Fase 2) dipakai untuk menghitung utang ke pemilik barang
3. Untuk MVP: cukup flag + pencatatan. Alur pembayaran konsinyasi menyusul di Fase 2

### 5.6 Supplier
1. `tipe = pbf` → `no_izin_pbf` wajib diisi
2. Supplier yang sudah punya transaksi pembelian **tidak bisa dihapus** — hanya dinonaktifkan
3. Data supplier bisa dipakai juga sebagai "Dokter" (jika diperlukan) — dipisahkan oleh tipe

---

## 6. Alur Pengguna (Frontend Flow)

Modul Master Data adalah **halaman admin** — layout standard: sidebar navigasi sub-modul + panel konten utama.

### 6.1 Struktur Halaman

```
┌─────────────────────────────────────────────────────────┐
│  TOP BAR (sama dengan modul Kasir)                      │
├──────────┬──────────────────────────────────────────────┤
│ SIDEBAR  │  KONTEN UTAMA                                │
│          │                                              │
│ 📦 Produk│  ┌─────────────────────────────────────────┐ │
│ 📂 Kateg.│  │  [Tambah Produk] [Import Excel]  🔍 Q  │ │
│ ⚖️ Satuan│  ├─────────────────────────────────────────┤ │
│ 🏭 Supp. │  │  Tabel Produk (sortable, filterable)   │ │
│          │  │  Kode | Nama | Generik | Gol | Harga.. │ │
│          │  └─────────────────────────────────────────┘ │
└──────────┴──────────────────────────────────────────────┘
```

### 6.2 Daftar Produk (List View)

**Fitur tabel:**
- Kolom: Kode, Nama Dagang, Nama Generik, Kategori, Golongan (badge warna), Satuan Dasar, Harga Jual, Stok Total, Status
- Sortable: klik header kolom (default sort: nama dagang A-Z)
- Filter: golongan (multi-select pills), kategori (dropdown), status (aktif/nonaktif/semua)
- Search: real-time search by nama dagang, nama generik, kode produk, barcode
- Pagination: 25/50/100 baris per halaman

**Baris tabel:**
- Klik baris → buka panel detail/edit (slide-over dari kanan)
- Nonaktif: baris abu-abu, teks strikethrough
- Stok ≤ stok_minimum: indikator amber ⚠ di kolom stok
- Hover: highlight entire row

### 6.3 Form Produk (Slide-Over)

Panel lebar 600px geser dari kanan, berisi form lengkap untuk create/edit produk.

```
┌─────────────────────────────────────────┐
│  ← Tutup      Produk Baru / Edit        │
│  ─────────────────────────────────────  │
│                                         │
│  INFORMASI DASAR                        │
│  ┌────────────────────────────────────┐ │
│  │ Kode Produk    [PROD-A01-000042]   │ │ ← Auto/Manual
│  │ Nama Dagang *  [Paracetamol 500..] │ │
│  │ Nama Generik   [Paracetamol]       │ │
│  │ Produsen       [Kimia Farma]       │ │
│  └────────────────────────────────────┘ │
│                                         │
│  KLASIFIKASI                            │
│  ┌────────────────────────────────────┐ │
│  │ Kategori  [▾ Obat Bebas Analges..]│ │
│  │ Golongan  [▾ Obat Bebas          ]│ │ ← Badge warna
│  │ ──────────────────────────────── │ │
│  │ ☐ Barang Konsinyasi (titipan)    │ │
│  └────────────────────────────────────┘ │
│                                         │
│  HARGA & STOK                           │
│  ┌────────────────────────────────────┐ │
│  │ Harga Beli  Rp [______]            │ │
│  │ Harga Jual  Rp [______]            │ │
│  │ HET         Rp [______]  (opsional)│ │
│  │ ──────────────────────────────── │ │
│  │ Stok Minimum  [10]                │ │
│  │ Stok Maksimum [1000]  (0=tidak)   │ │
│  └────────────────────────────────────┘ │
│                                         │
│  SATUAN & KONVERSI                      │
│  ┌────────────────────────────────────┐ │
│  │ Satuan Dasar  [Tablet   ▾]        │ │
│  │                                    │ │
│  │ Satuan Lain:                       │ │
│  │ ┌──────┬────────┬───────┬────────┐ │ │
│  │ │Satuan│Barcode │Konv.  │Default?│ │ │
│  │ ├──────┼────────┼───────┼────────┤ │ │
│  │ │Strip │899273..│10 tab │ ◉ Jual │ │ │
│  │ │Box   │        │100 tab│        │ │ │
│  │ └──────┴────────┴───────┴────────┘ │ │
│  │ [+ Tambah Satuan]                  │ │
│  └────────────────────────────────────┘ │
│                                         │
│  BARCODE                                │
│  ┌────────────────────────────────────┐ │
│  │ Barcode Pabrik   [8992733991234]  │ │
│  │ Barcode Internal [PROD-000042    ]│ │
│  │ [+ Tambah Barcode]                │ │
│  └────────────────────────────────────┘ │
│                                         │
│  GAMBAR                                 │
│  ┌────────────────────────────────────┐ │
│  │ ┌──────┐                            │ │
│  │ │      │   Klik atau drag untuk     │ │
│  │ │ 📷   │   upload gambar produk     │ │
│  │ └──────┘   Max 1MB, 400x400px      │ │
│  └────────────────────────────────────┘ │
│                                         │
│  ┌──────────┐    ┌────────────────────┐ │
│  │  Batal   │    │   💾 Simpan       │ │
│  └──────────┘    └────────────────────┘ │
└─────────────────────────────────────────┘
```

### 6.4 Kategori (Sub-modul)

Layout: sidebar kiri (tree kategori) + panel kanan (detail/CRUD).

```
┌─────────────────────────────────────────┐
│ KATEGORI PRODUK                         │
│ ┌────────────────┐ ┌──────────────────┐ │
│ │ [+ Tambah]     │ │ Detail Kategori  │ │
│ │                │ │                  │ │
│ │ 📁 Obat (3)    │ │ Nama: Obat Bebas│ │
│ │  📁 Bebas (12) │ │ Parent: Obat    │ │
│ │  📁 Keras (8)  │ │ 12 produk       │ │
│ │ 📁 Vitamin (5) │ │                  │ │
│ │ 📁 Alkes (9)   │ │ [Edit] [Hapus]  │ │
│ └────────────────┘ └──────────────────┘ │
└─────────────────────────────────────────┘
```

### 6.5 Satuan (Sub-modul)

Tabel sederhana: Nama, Singkatan, Jumlah Produk yang pakai.

```
┌─────────────────────────────────────────┐
│ MASTER SATUAN          [+ Tambah Satuan]│
│ ─────────────────────────────────────── │
│ Tablet    | tab  | 45 produk            │
│ Strip     | str  | 32 produk            │
│ Box       | box  | 28 produk            │
│ Botol     | btl  | 15 produk            │
│ Kapsul    | kaps | 22 produk            │
│ Tube      | tube | 6 produk             │
│ Sachet    | sch  | 14 produk            │
│ Pcs       | pcs  | 30 produk            │
└─────────────────────────────────────────┘
```

### 6.6 Supplier (Sub-modul)

Tabel: Kode, Nama, Tipe (PBF/Umum), Kota, Telepon, Status. Klik → form edit di slide-over.

### 6.7 Import Produk (Excel/CSV)

```
┌──────────────────────────────────────────┐
│  IMPORT PRODUK                           │
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
│     │ ✓ 45 baris valid                 │ │
│     │ ⚠ 3 baris error (kode duplikat) │ │
│     │     [Lihat Detail Error]         │ │
│     └──────────────────────────────────┘ │
│                                          │
│  4. [Import 45 Produk]                  │
└──────────────────────────────────────────┘
```

---

## 7. Build Prompt (Siap Pakai)

```
Saya sedang membangun modul "Master Data" untuk aplikasi POS apotek berbasis web,
multi-tenant SaaS, menggunakan [STACK]. Database: PostgreSQL (Supabase).

KONTEKS SISTEM:
- Multi-tenant: setiap tabel wajib punya tenant_id + RLS (Row Level Security)
- 3 role: owner, admin (apoteker), kasir
- Admin/Owner bisa CRUD master data, Kasir hanya read

TUGAS:
Bangun modul Master Data dengan scope berikut:

1. SKEMA DATABASE
   Buatkan migration SQL untuk tabel: products, product_categories, units,
   product_units, product_barcodes, suppliers, drug_classifications (tabel referensi global).
   Gunakan skema kolom persis sesuai PRD Bagian 4.

   Sertakan:
   - UNIQUE constraint: (tenant_id, kode_produk), (tenant_id, barcode)
   - Foreign key cascade rules (jangan cascade delete — produk terkait transaksi tidak boleh dihapus)
   - RLS policy: Kasir SELECT only, Admin/Owner full CRUD
   - Seed data untuk drug_classifications (7 golongan)

2. BACKEND LOGIC / API Endpoints
   - CRUD produk (create, read, update, soft-delete/toggle aktif)
   - Search produk (full-text atau ILIKE): by nama_dagang, nama_generik, kode_produk, barcode
   - Filter produk: by golongan, kategori_id, is_aktif
   - CRUD kategori (termasuk parent-child hierarchy)
   - CRUD satuan
   - CRUD product_units dengan validasi konversi (minimal 1 satuan dasar)
   - CRUD barcode (pastikan unique per tenant)
   - CRUD supplier
   - Auto-generate kode_produk jika kosong: format PROD-{prefix}-{6digit}
   - Validasi: harga_jual wajib > harga_beli
   - Import massal dari CSV/Excel (parsing + validasi batch + insert)

3. FRONTEND
   - Layout admin: sidebar navigasi sub-modul + panel konten utama
   - Tabel produk dengan: sort, filter, search, pagination, row click → detail
   - Form produk (slide-over panel 600px): semua field sesuai Bagian 6.3, termasuk:
     - Sub-form product_units (dynamic add/remove baris, pilih satuan dropdown, input konversi)
     - Sub-form barcodes (dynamic add/remove, pilih tipe pabrik/internal)
     - Upload gambar (drag & drop, preview, max 1MB)
   - Tree kategori: bisa expand/collapse, drag-and-drop untuk reorder (opsional MVP)
   - Tabel satuan & supplier: standar CRUD
   - Halaman import: download template → upload → preview hasil validasi → konfirmasi import
   - Badge warna untuk golongan obat (sesuai drug_classifications.warna_badge)
   - Responsif: tabel bisa horizontal-scroll di tablet

MULAI DARI:
a) Skema database + migration SQL + RLS policy
b) Baru lanjut ke API endpoints & frontend
```

---

## 8. Catatan untuk Modul Berikutnya

- **Modul Pembelian** akan membaca data dari `products`, `suppliers`, dan `product_units` — terutama saat input faktur: pilih produk → pilih satuan → sistem konversi ke satuan dasar untuk pencatatan stok
- **Modul Persediaan** akan membaca `stok_minimum` dan `stok_maksimum` dari products untuk fitur defecta
- **Modul Konsinyasi (Fase 2)** akan membaca `is_konsinyasi = true` untuk memisahkan stok titipan
- **Modul Kasir** akan membaca `golongan` untuk menentukan apakah produk butuh validasi Admin, dan product_units untuk menampilkan satuan jual yang tersedia
