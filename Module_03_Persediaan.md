# Module PRD — Persediaan (Inventory)
### Bagian dari: Sistem POS & ERP Apotek
Versi: 1.0 | Status: Final

---

## 1. Ringkasan & Scope

Modul ini mengelola seluruh siklus stok produk — dari batch, kadaluarsa, mutasi, hingga stock opname. Ini adalah modul paling kritis untuk akurasi data obat di apotek.

✅ **Termasuk (MVP):**
- **Product Batches** — setiap stok tercatat per batch (nomor batch + tanggal kadaluarsa), bukan cuma total stok mentah
- **Kartu Stok** — riwayat lengkap setiap mutasi stok (masuk dari pembelian, keluar dari penjualan, adjustment, retur, opname) — wajib untuk audit farmasi
- **FEFO Engine** — sistem otomatis pilih batch dengan expiry terdekat setiap kali stok keluar
- **Monitor Kadaluarsa** — dashboard produk yang akan/sudah kadaluarsa dalam X hari ke depan (threshold bisa diatur)
- **Stock Opname** — pencatatan hitung fisik vs stok sistem, dengan selisih otomatis & approval berjenjang
- **Defecta** — daftar otomatis produk yang perlu reorder (stok ≤ stok_minimum), bisa langsung jadi PO
- **Stok Adjustment** — penyesuaian stok manual dengan alasan & approval (untuk koreksi di luar opname)

❌ **Belum termasuk (menyusul):**
- Multi-gudang / multi-rak (lokasi fisik) — saat ini stok dianggap per outlet, bukan per rak
- Perpindahan stok antar outlet (transfer) — hanya relevan jika apotek punya >1 outlet
- Karantina otomatis stok kadaluarsa (pemindahan ke gudang karantina) — untuk sekarang cukup flag + laporan
- Perhitungan otomatis kecepatan penjualan untuk defecta (velocity-based reorder) — MVP cukup berdasarkan stok_minimum

---

## 2. Dependency

Modul ini bergantung ke:
- **Master Data** → `products` (stok_minimum, satuan_dasar), `product_units` (konversi)
- **Pembelian** (modul berikutnya) → faktur pembelian akan **menciptakan** baris `product_batches` & `stock_mutations`

Modul yang bergantung ke Persediaan:
- **Kasir** → saat checkout, kurangi stok dari `product_batches` via FEFO, catat `stock_mutations` keluar
- **Pembelian** → saat terima barang, tambah stok ke `product_batches`, catat `stock_mutations` masuk
- **Laporan** → kartu stok, laporan kadaluarsa, laporan defecta

---

## 3. Role & Hak Akses

| Aksi | Kasir | Admin (Apoteker) | Owner |
|---|---|---|---|
| Lihat stok produk (total) | ✅ | ✅ | ✅ |
| Lihat detail batch per produk | ✅ | ✅ | ✅ |
| Lihat kartu stok (mutasi) | ✅ | ✅ | ✅ |
| Buat stock opname (draft) | ❌ | ✅ | ✅ |
| Input hasil hitung fisik | ✅ (asisten input) | ✅ | ✅ |
| Approve stock opname | ❌ | ✅ | ✅ |
| Adjustment stok manual | ❌ | ✅ | ✅ |
| Lihat dashboard kadaluarsa | ❌ | ✅ | ✅ |
| Lihat daftar defecta | ❌ | ✅ | ✅ |
| Generate PO dari defecta | ❌ | ✅ | ✅ |

---

## 4. Skema Data (Backend)

### 4.1 `product_batches` — Batch per Produk

Ini adalah tabel **paling penting** di modul Persediaan. Setiap kali barang masuk (dari pembelian), dibuatkan 1 baris batch. Setiap kali barang keluar (penjualan), stok batch berkurang.

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | |
| product_id | uuid | FK ke products |
| outlet_id | uuid | FK ke outlets (lokasi stok) |
| nomor_batch | varchar(100) | Nomor lot/batch dari pabrik/PBF |
| tanggal_kadaluarsa | date | Expiry date |
| stok | numeric | Stok saat ini (dalam satuan dasar produk) |
| stok_awal | numeric | Stok awal saat batch ini diterima |
| faktur_pembelian_id | uuid, nullable | FK ke purchase_invoices (trace asal batch) |
| catatan | text, nullable | Keterangan tambahan |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Index strategis:**
- INDEX(tenant_id, product_id, stok) — untuk query FEFO (cari batch dengan stok > 0, expiry terdekat)
- INDEX(tenant_id, tanggal_kadaluarsa) — untuk monitor kadaluarsa
- UNIQUE(tenant_id, product_id, nomor_batch, outlet_id) — batch yang sama tidak boleh duplikat

**Rule:**
- Stok tidak boleh negatif (enforced di aplikasi level, dengan optimistic locking atau SELECT FOR UPDATE)
- Begitu `stok = 0`, batch tetap disimpan (tidak dihapus) — untuk audit trail
- Saat stok masuk dari pembelian: cari batch dengan `nomor_batch` yang sama → tambah `stok`, atau buat baris baru

### 4.2 `stock_mutations` — Kartu Stok / Mutasi Stok

Riwayat setiap perubahan stok. Satu baris = satu kejadian (masuk, keluar, adjustment, opname).

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | |
| product_id | uuid | FK ke products |
| batch_id | uuid | FK ke product_batches |
| product_unit_id | uuid | FK ke product_units (satuan mutasi ini) |
| tipe | enum | `masuk`, `keluar`, `adjustment`, `opname_masuk`, `opname_keluar`, `retur_masuk`, `retur_keluar` |
| qty | numeric | Jumlah dalam satuan unit_id |
| qty_dasar | numeric | Jumlah dikonversi ke satuan dasar (untuk kalkulasi) |
| stok_sebelum | numeric | Stok batch SEBELUM mutasi (satuan dasar) |
| stok_sesudah | numeric | Stok batch SESUDAH mutasi (satuan dasar) |
| referensi_id | uuid, nullable | ID transaksi terkait (FK generik) |
| referensi_tipe | varchar(50), nullable | `penjualan`, `pembelian`, `stock_opname`, `adjustment`, `retur` |
| catatan | text, nullable | Keterangan / alasan |
| created_by | uuid | FK ke users |
| created_at | timestamptz | |

**Index:**
- INDEX(tenant_id, product_id, created_at DESC) — untuk kartu stok per produk
- INDEX(tenant_id, batch_id, created_at DESC) — untuk kartu stok per batch
- INDEX(tenant_id, tipe, created_at) — untuk laporan mutasi

**Rule — Mutasi HARUS atomic:**
1. Update `product_batches.stok` = `stok_sesudah`
2. Insert `stock_mutations`
3. Keduanya dalam 1 transaksi database — jika salah satu gagal, rollback semua

### 4.3 `stock_opname` — Sesi Stock Opname

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | |
| outlet_id | uuid | FK ke outlets |
| status | enum | `draft`, `menunggu_approval`, `disetujui`, `ditolak` |
| catatan | text, nullable | |
| created_by | uuid | FK ke users |
| approved_by | uuid, nullable | FK ke users (Admin/Owner yang approve) |
| created_at | timestamptz | |
| approved_at | timestamptz, nullable | |

### 4.4 `stock_opname_items` — Item per Sesi Opname

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | |
| opname_id | uuid | FK ke stock_opname |
| product_id | uuid | FK ke products |
| batch_id | uuid, nullable | FK ke product_batches (opsional, jika batch-specific) |
| stok_sistem | numeric | Stok di database saat opname dimulai (snapshot) |
| stok_fisik | numeric, nullable | Hasil hitungan fisik (diisi staff) |
| selisih | numeric, auto-calc | `stok_fisik - stok_sistem` (negatif = kurang, positif = lebih) |
| catatan | text, nullable | Keterangan selisih |

**Rule:**
- `stok_sistem` di-snapshot saat opname dibuat (tidak berubah meski ada transaksi baru setelahnya)
- Begitu opname di-approve status `disetujui`, sistem otomatis:
  - Buat `stock_mutations` untuk setiap selisih (tipe `opname_masuk` atau `opname_keluar`)
  - Update `product_batches.stok`
- Opname yang sudah `disetujui` tidak bisa diedit

### 4.5 View / Query: `defecta_list`

Tidak perlu tabel khusus. Query:

```sql
SELECT 
  p.id, p.kode_produk, p.nama_dagang, p.nama_generik,
  p.stok_minimum,
  p.rata_rata_penjualan_harian,
  COALESCE(SUM(pb.stok), 0) as total_stok,
  p.stok_minimum - COALESCE(SUM(pb.stok), 0) as kekurangan,

  -- Supplier utama + lead time
  ps.supplier_id as supplier_utama_id,
  s.nama as supplier_utama,
  ps.lead_time_hari,

  -- Kalkulasi urgency
  CASE 
    WHEN p.rata_rata_penjualan_harian IS NULL OR p.rata_rata_penjualan_harian = 0 THEN NULL
    ELSE ROUND(COALESCE(SUM(pb.stok), 0) / p.rata_rata_penjualan_harian, 1)
  END as hari_sampai_habis,

  -- Urgency: "SEKARANG" jika stok habis < lead time, "BESOK" jika < lead time + buffer 3 hari, "RENCANA" jika aman
  CASE
    WHEN COALESCE(SUM(pb.stok), 0) = 0 THEN 'SEKARANG'
    WHEN p.rata_rata_penjualan_harian IS NULL OR p.rata_rata_penjualan_harian = 0 THEN 'PERIKSA'
    WHEN ps.lead_time_hari IS NULL THEN 'PERIKSA'
    WHEN ROUND(COALESCE(SUM(pb.stok), 0) / p.rata_rata_penjualan_harian, 1) <= ps.lead_time_hari THEN 'SEKARANG'
    WHEN ROUND(COALESCE(SUM(pb.stok), 0) / p.rata_rata_penjualan_harian, 1) <= ps.lead_time_hari + 3 THEN 'BESOK'
    ELSE 'RENCANA'
  END as urgency

FROM products p
LEFT JOIN product_batches pb ON pb.product_id = p.id AND pb.outlet_id = ?
LEFT JOIN product_suppliers ps ON ps.product_id = p.id AND ps.is_supplier_utama = true
LEFT JOIN suppliers s ON s.id = ps.supplier_id
WHERE p.tenant_id = ? AND p.is_aktif = true
  AND p.stok_minimum > 0
GROUP BY p.id, ps.supplier_id, s.nama, ps.lead_time_hari
HAVING COALESCE(SUM(pb.stok), 0) <= p.stok_minimum
ORDER BY 
  CASE 
    WHEN COALESCE(SUM(pb.stok), 0) = 0 THEN 0
    WHEN ROUND(COALESCE(SUM(pb.stok), 0) / COALESCE(NULLIF(p.rata_rata_penjualan_harian, 0), 1), 1) <= COALESCE(ps.lead_time_hari, 999) THEN 1
    ELSE 2
  END ASC,
  kekurangan DESC
```

**Kolom defecta display (frontend table):**

| Kolom | Sumber | Keterangan |
|-------|--------|-----------|
| Kode | p.kode_produk | |
| Produk | p.nama_dagang | |
| Stok | total_stok | |
| Min | p.stok_minimum | |
| Kurang | kekurangan | |
| Rata² Penjualan/hari | p.rata_rata_penjualan_harian | Input manual |
| Stok Habis Dalam | hari_sampai_habis | Kalkulasi: stok / rata² penjualan |
| Supplier Utama | s.nama | Dari product_suppliers.is_supplier_utama |
| Lead Time | ps.lead_time_hari | Hari dari order ke terima |
| Urgency | urgency | Badge: SEKARANG (merah), BESOK (amber), RENCANA (biru), PERIKSA (abu) |

**Arti badge urgency:**
- 🔴 **SEKARANG** — stok 0, atau stok akan habis sebelum lead time (mis: stok habis 2 hari, lead time 5 hari → sudah terlambat)
- 🟠 **BESOK** — stok akan habis dalam lead time + 3 hari buffer (masih ada waktu sempit)
- 🔵 **RENCANA** — stok di bawah minimum tapi masih di atas lead time + buffer (bisa direncanakan)
- ⚪ **PERIKSA** — data `rata_rata_penjualan_harian` atau `lead_time_hari` belum diisi (tidak bisa kalkulasi otomatis)

---

## 5. Business Rules

### 5.1 Batches & Stok
1. **Satu produk bisa punya banyak batch** — setiap batch punya `nomor_batch` dan `tanggal_kadaluarsa` unik
2. **Stok produk = SUM(stok) dari semua batch aktif milik produk tersebut**
3. **Batch tidak pernah dihapus** — meski stok sudah habis, tetap ada untuk audit trail
4. **Stok masuk dari pembelian** akan bisa memperbarui batch existing (jika `nomor_batch` sama) atau membuat batch baru
5. **Batch kadaluarsa** (tanggal_kadaluarsa < hari_ini AND stok > 0): sistem bisa auto-set stok = 0 dengan mutasi adjustment (opsional, dikonfigurasi per tenant)

### 5.2 FEFO (First Expired First Out)
FEFO adalah **aturan baku** di setiap pengeluaran stok:

```sql
SELECT * FROM product_batches
WHERE tenant_id = ? AND product_id = ? AND outlet_id = ?
  AND stok > 0
  AND tanggal_kadaluarsa > CURRENT_DATE  -- tidak kadaluarsa
ORDER BY tanggal_kadaluarsa ASC           -- expiry terdekat dulu
LIMIT 1
```

**Algoritma saat checkout:**
1. Produk X diminta qty = 25 tablet
2. Query batch FEFO → dapat Batch A (expiry Jan 2027, stok 10)
3. Kurangi Batch A: stok jadi 0, qty terpenuhi 10, sisa 15
4. Query lagi → Batch B (expiry Mar 2027, stok 30)
5. Kurangi Batch B: stok jadi 15, qty terpenuhi 25
6. Buat 2 baris `stock_mutations` (satu per batch, tipe `keluar`)
7. Semua dalam 1 transaksi database

### 5.3 Kartu Stok
1. **Setiap perubahan stok WAJIB** menghasilkan 1 baris `stock_mutations`
2. Kolom `stok_sebelum` dan `stok_sesudah` memungkinkan rekonstruksi saldo stok kapan pun
3. Kartu stok per produk = `SELECT * FROM stock_mutations WHERE product_id = ? ORDER BY created_at DESC`
4. Kartu stok bisa difilter per batch, per tipe mutasi, per rentang tanggal

### 5.4 Stock Opname
1. Saat membuat sesi opname, **`stok_sistem` di-snapshot** dari data terkini (tidak berubah meski ada transaksi baru)
2. Staff input `stok_fisik` → `selisih` otomatis dihitung
3. Opname butuh **approval Admin/Owner** sebelum diterapkan
4. Saat approve → buat `stock_mutations` + update `product_batches` atomically
5. Selisih positif (lebih) → masuk sebagai `opname_masuk`
6. Selisih negatif (kurang) → keluar sebagai `opname_keluar`

### 5.5 Defecta (dengan Lead Time & Urgency)
1. Defecta = daftar produk dengan `stok ≤ stok_minimum`
2. **Lead time** diambil dari `product_suppliers.lead_time_hari` untuk supplier utama produk tersebut
3. **Rata-rata penjualan harian** diambil dari `products.rata_rata_penjualan_harian` (input manual)
4. **Hari sampai habis** = stok_saat_ini / rata_rata_penjualan_harian
5. **Urgency** dihitung otomatis:
   - Stok 0 → `SEKARANG`
   - `hari_sampai_habis ≤ lead_time_hari` → `SEKARANG` (terlambat)
   - `hari_sampai_habis ≤ lead_time_hari + 3` → `BESOK` (mepet)
   - Selebihnya → `RENCANA` (bisa dijadwalkan)
   - Data tidak lengkap → `PERIKSA` (butuh input manual)
6. Bisa difilter per supplier, per urgency
7. "Generate PO" → menandai item + supplier utama untuk modul Pembelian
8. **Lead time dan rata-rata penjualan diinput manual** di Master Data oleh Admin/Owner (karena sistem baru belum punya cukup data historis untuk kalkulasi otomatis). Di Fase 2, sistem bisa auto-hitung rata-rata penjualan dari `stock_mutations` 90 hari terakhir.

### 5.6 Monitor Kadaluarsa
1. Dashboard menampilkan batch dengan `tanggal_kadaluarsa` dalam X hari ke depan (default 90 hari, bisa diatur)
2. Kategori:
   - **Sudah kadaluarsa** (< hari ini, stok > 0) → badge merah
   - **Kritis** (< 30 hari) → badge merah
   - **Hampir kadaluarsa** (30-90 hari) → badge amber
   - **Aman** (> 90 hari) → tidak perlu ditampilkan
3. Dari sini admin bisa langsung adjustment stok atau retur (jika retur ke PBF dimungkinkan)

---

## 6. Alur Pengguna (Frontend Flow)

### 6.1 Struktur Halaman

```
┌─────────────────────────────────────────────────────────┐
│  TOP BAR                                                │
├──────────┬──────────────────────────────────────────────┤
│ SIDEBAR  │  KONTEN UTAMA                                │
│          │                                              │
│ 📊 Stok  │  [Sub-modul content berdasarkan tab]        │
│ 📦 Batch │                                              │
│ 🟢 Kar.Stk│                                              │
│ ⏰ Kadalu.│                                              │
│ 📋 Opname│                                              │
│ ⚠ Defecta│                                              │
│ ✏️ Adj.   │                                              │
└──────────┴──────────────────────────────────────────────┘
```

### 6.2 Dashboard Stok (Tab Utama)

**KPI Cards:**
- Total SKU Aktif
- Total Nilai Stok (harga beli × stok per SKU)
- Batch Hampir Kadaluarsa (<90 hari)
- Item Butuh Reorder (defecta count)

**Tabel Stok Produk** — searchable, filterable, sortable:
| Kolom | Keterangan |
|-------|-----------|
| Kode | kode_produk |
| Nama Dagang | |
| Kategori | |
| Satuan Dasar | |
| Stok Total | SUM dari semua batch |
| Stok Min | stok_minimum |
| Status | OK / Menipis / Habis / Overstok |
| Batch | Jumlah batch aktif |
| Aksi | [Lihat Batch] [Kartu Stok] |

### 6.3 Detail Batch (Slide-over / Expand)

Klik "Lihat Batch" di baris produk → tampilkan semua batch:

| Nomor Batch | Expiry | Stok | Stok Awal | Asal Faktur | Status |
|-------------|--------|------|-----------|-------------|--------|
| BN-2025-001 | 12/2027 | 45 | 100 | FK-2025-0042 | ✅ OK |
| BN-2025-003 | 03/2027 | 10 | 50 | FK-2025-0067 | ⏰ Kritis |
| BN-2025-002 | 01/2026 | 5 | 30 | FK-2025-0051 | ❌ Kadaluarsa |

Warna baris:
- Hijau: expiry > 90 hari
- Amber: expiry 30-90 hari
- Merah: expiry < 30 hari atau sudah lewat

### 6.4 Kartu Stok (Tab)

Query stok per produk yang dipilih:

| DateTime | Tipe | Batch | Qty | Satuan | Stok Sebelum | Stok Sesudah | Ref | User |
|----------|------|-------|-----|--------|-------------|-------------|-----|------|
| 19/06 14:32 | Keluar | BN-001 | 2 | Strip (20 tab) | 45 | 25 | TRX-042 | Kasir A |
| 18/06 09:15 | Masuk | BN-003 | 5 | Box (50 tab) | 0 | 50 | FK-067 | Admin |
| 17/06 16:00 | Opname | BN-001 | -3 | Tablet | 48 | 45 | OPN-003 | Admin |

Filter: rentang tanggal, tipe mutasi, batch, user.

### 6.5 Monitor Kadaluarsa (Tab)

Dua section:
1. **Sudah & Hampir Kadaluarsa** — tabel batch dengan stok > 0 dan expiry < 90 hari (threshold adjustable)
2. **Riwayat Kadaluarsa** — batch yang sudah diproses/diadjustment

Tabel:
| Produk | Batch | Expiry | Stok | Hari Tersisa | Status |
|--------|-------|--------|------|-------------|--------|
| Amoxicillin 500mg | BN-2025-002 | 01/07/2026 | 5 | 12 hari | ❌ Kritis |
| Vitamin C 500mg | BN-2025-005 | 15/09/2026 | 45 | 88 hari | ⚠ Hampir |

Aksi per baris: [Adjustment] [Tandai Retur]

### 6.6 Stock Opname (Tab)

**Daftar sesi opname:**
| No | Tanggal | Outlet | Status | Dibuat oleh | Aksi |
|----|---------|--------|--------|-------------|------|
| OPN-004 | 19 Jun 2026 | Pusat | Draft | Dr. Andi | [Lanjutkan] [Hapus] |
| OPN-003 | 15 Jun 2026 | Pusat | Disetujui | Dr. Andi | [Lihat] |
| OPN-002 | 01 Jun 2026 | Pusat | Ditolak | Owner | [Lihat] |

Tombol: **[+ Buat Opname Baru]**

**Flow buat opname baru:**
1. Klik "+ Buat Opname Baru" → pilih outlet → sistem buat sesi + snapshot stok
2. Masuk ke halaman input: tabel semua produk dengan `stok_sistem` terisi
3. Staff input `stok_fisik` satu per satu (atau scan barcode → input qty)
4. Progress bar: "45/150 produk sudah diinput"
5. Setelah selesai → klik "Ajukan Approval"
6. Admin/Owner review → approve atau tolak

### 6.7 Defecta (Tab)

Tabel:
| Produk | Stok | Min | Kurang | Rata² Jual/hari | Habis Dalam | Supplier | Lead Time | Urgency | Aksi |
|--------|------|-----|--------|-----------------|-------------|----------|-----------|---------|------|
| Paracetamol | 3 | 10 | 7 | 5 | 0.6 hari | Kimia Farma | 3 hari | 🔴 SEKARANG | [PO] |
| Cetirizine | 2 | 10 | 8 | 0.5 | 4 hari | Indofarma | 5 hari | 🔴 SEKARANG | [PO] |
| Antimo | 0 | 15 | 15 | 2 | 0 hari | Kimia Farma | 3 hari | 🔴 SEKARANG | [PO] |
| Vit C | 45 | 60 | 15 | 3 | 15 hari | — | — | ⚪ PERIKSA | [PO] |

- Baris di-sort by urgency (SEKARANG dulu, lalu BESOK, RENCANA, PERIKSA)
- Badge urgency: 🔴 SEKARANG (red), 🟠 BESOK (amber), 🔵 RENCANA (blue), ⚪ PERIKSA (gray)
- PERIKSA = data `rata_rata_penjualan_harian` atau `lead_time_hari` belum diisi → Admin/Owner harus isi dulu di Master Data
- Klik "[PO]" → tandai item + redirect ke modul Pembelian (pre-fill supplier utama)
- Filter: per supplier, per urgency level

### 6.8 Stok Adjustment (Tab)

Form adjustment untuk koreksi manual (rusak, hilang, pecah, sample):

```
┌──────────────────────────────────────────┐
│  Stok Adjustment                         │
│  ────────────────────────────────────── │
│                                          │
│  Produk      [Cari produk...        ▾]  │
│  Batch       [BN-2025-001 (45 tab) ▾]   │
│  Tipe        [◉ Kurang  ○ Tambah]       │
│  Qty         [___] Tablet               │
│  Alasan *    [▾ Rusak / Pecah]          │
│              [▾ Hilang / Tidak ditemukan]│
│              [▾ Sample / Diberikan gratis]│
│              [▾ Lainnya...]             │
│  Catatan     [_____________]            │
│                                          │
│  ┌──────────┐   ┌──────────────────────┐│
│  │  Batal   │   │   Simpan Adjustment  ││
│  └──────────┘   └──────────────────────┘│
└──────────────────────────────────────────┘
```

---

## 7. Build Prompt (Siap Pakai)

```
Saya sedang membangun modul "Persediaan (Inventory)" untuk aplikasi POS apotek
berbasis web, multi-tenant SaaS, menggunakan [STACK]. Database: PostgreSQL (Supabase).

KONTEKS:
- Multi-tenant: semua tabel wajib tenant_id + RLS
- 3 role: owner, admin (apoteker), kasir
- Tabel products, product_units, suppliers sudah ada dari modul Master Data
- Tabel sales_transactions sudah ada dari modul Kasir

TUGAS — bangun modul ini dengan prioritas:

1. SKEMA DATABASE
   Buat migration SQL untuk tabel: product_batches, stock_mutations,
   stock_opname, stock_opname_items. Ikuti skema di PRD Bagian 4.

   RLS policy:
   - Kasir: SELECT semua data persediaan, INSERT stock_mutations (untuk checkout),
     UPDATE product_batches.stok (untuk checkout) — pastikan hanya bisa untuk
     transaksinya sendiri
   - Admin/Owner: full CRUD termasuk stock_opname approval & adjustment

2. BACKEND LOGIC (paling kritikal — FEFO & atomic stock mutation)
   a. **Fungsi FEFO untuk pengeluaran stok** (dipanggil saat checkout di Kasir):
      - Terima: product_id, qty_diperlukan (dalam satuan dasar)
      - Return: array of { batch_id, qty_diambil }
      - Algoritma: query batch dengan stok > 0, expiry > today, ORDER BY expiry ASC
      - Split qty ke multiple batch jika batch pertama tidak cukup
      - Semua dalam 1 database transaction (SELECT FOR UPDATE untuk mencegah race condition)

   b. **Fungsi atomic stock mutation:**
      - Terima: product_id, batch_id, tipe, qty, referensi_id, referensi_tipe
      - Lakukan: hitung stok_sesudah, UPDATE product_batches.stok, INSERT stock_mutations
      - Pastikan stok tidak negatif (throw error jika stok < 0)
      - Semua dalam 1 transaction

   c. **Stock Opname workflow:**
      - Buat sesi opname: snapshot stok_sistem untuk semua produk di outlet
      - Input hasil: update stock_opname_items.stok_fisik
      - Approve: Admin klik approve → loop semua item dengan selisih ≠ 0 →
        buat stock_mutations + update product_batches
      - Tolak: kembalikan ke draft

   d. **Kartu Stok query:**
      - Endpoint paginasi dengan filter: product_id, batch_id, tipe, tanggal_mulai, tanggal_akhir

3. FRONTEND
   Halaman admin dengan sidebar navigasi sub-modul:

   a. **Dashboard Stok** — KPI cards (total SKU, nilai stok, batch kadaluarsa, defecta count)
      + tabel stok produk (search, filter, sort)

   b. **Detail Batch** — tabel batch per produk dengan warna berdasarkan sisa hari expiry
      (hijau/amber/merah)

   c. **Kartu Stok** — tabel mutasi per produk (DateTime, Tipe, Batch, Qty, Stok Sblm/Ssdh, Ref, User)
      dengan filter rentang tanggal, tipe, batch

   d. **Monitor Kadaluarsa** — tabel batch dengan stok > 0 di bawah 90 hari,
      status badge (kritis < 30h, hampir 30-90h), tombol Adjustment langsung

   e. **Stock Opname** — grid sesi opname + form input hasil hitung fisik (mirip tabel
      dengan kolom stok_sistem, stok_fisik, selisih auto-calc), progress bar input,
      approval flow (Admin review → approve/tolak)

   f. **Defecta** — tabel produk dengan stok ≤ minimum, checkbox multiple untuk
      "Generate PO" (redirect ke modul Pembelian)

   g. **Stok Adjustment** — form: pilih produk, pilih batch, tipe (kurang/tambah),
      qty, alasan dropdown, catatan

MULAI DARI:
a) Skema database + migration (product_batches, stock_mutations, stock_opname)
b) Backend RPC: FEFO engine & atomic stock mutation (ini paling kritikal)
c) Stock opname workflow
d) Frontend halaman persediaan
```

---

## 8. Catatan untuk Modul Berikutnya

- **Modul Pembelian** akan memanggil fungsi atomic stock mutation (tipe `masuk`) saat barang diterima, menciptakan batch baru atau update batch existing
- **Modul Kasir** akan memanggil FEFO engine + stock mutation (tipe `keluar`) saat checkout
- **Modul Retur Penjualan** akan memanggil stock mutation (tipe `retur_masuk`)
- **Modul Konsinyasi** akan membaca `product_batches` + flag `is_konsinyasi` di products
- Sistem notifikasi (lonceng) akan membaca tabel `product_batches.tanggal_kadaluarsa` untuk peringatan kadaluarsa
