# Module PRD — Pembelian (Purchasing)
### Bagian dari: Sistem POS & ERP Apotek
Versi: 1.0 | Status: Final

---

## 1. Ringkasan & Scope

Modul ini menangani seluruh siklus pembelian — dari PO, penerimaan barang, hingga retur ke supplier. Setiap penerimaan barang otomatis menambah stok di `product_batches` dan mencatat `stock_mutations` (terhubung ke modul Persediaan).

✅ **Termasuk (MVP):**
- **Purchase Order (PO)** — buat PO manual atau generate dari Defecta, lacak status (draft/dikirim/sebagian/lunas)
- **Faktur Pembelian (Receiving)** — input barang yang diterima: qty aktual, nomor batch, tanggal kadaluarsa, harga beli aktual
- **Retur Pembelian** — kembalikan barang ke supplier (rusak, salah kirim, mendekati ED)
- **Hutang Supplier** — otomatis tercatat dari faktur yang belum lunas
- **Riwayat Pembelian** — semua PO & faktur, bisa difilter per supplier/periode
- **Penerimaan Parsial** — PO bisa diterima sebagian (PBF sering kirim bertahap)

❌ **Belum termasuk (menyusul):**
- Order online langsung ke PBF dari dalam aplikasi (integrasi API)
- Input faktur via foto + OCR/AI
- Approval workflow PO multi-level
- Terms kredit / tempo pembayaran detail
- Diskon dari supplier per faktur

---

## 2. Dependency

Modul ini bergantung ke:
- **Master Data** → `products`, `product_units`, `suppliers`, `product_suppliers`
- **Persediaan** → `product_batches` (disini batch **dibuat/diupdate**), `stock_mutations` (disini mutasi **masuk** dicatat)

Modul yang bergantung ke Pembelian:
- **Keuangan** → hutang supplier otomatis dari faktur yang belum lunas
- **Laporan** → riwayat pembelian, analisa harga beli

---

## 3. Role & Hak Akses

| Aksi | Kasir | Admin (Apoteker) | Owner |
|---|---|---|---|
| Lihat PO & faktur | ❌ | ✅ | ✅ |
| Buat PO baru | ❌ | ✅ | ✅ |
| Edit PO (sebelum dikirim) | ❌ | ✅ | ✅ |
| Hapus PO (draft) | ❌ | ✅ | ✅ |
| Input faktur / terima barang | ❌ | ✅ | ✅ |
| Input retur pembelian | ❌ | ✅ | ✅ |
| Tandai faktur lunas | ❌ | ❌ | ✅ |
| Lihat hutang supplier | ❌ | ✅ | ✅ |
| Generate PO dari Defecta | ❌ | ✅ | ✅ |

---

## 4. Skema Data (Backend)

### 4.1 `purchase_orders` — Pesanan Pembelian (PO)

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | |
| outlet_id | uuid | FK ke outlets |
| nomor_po | varchar(50) | Auto-generate: `PO-{tenant_prefix}-{6digit}` |
| supplier_id | uuid | FK ke suppliers |
| tanggal_po | date | Tanggal PO dibuat |
| status | enum | `draft`, `dikirim`, `sebagian`, `lunas` |
| catatan | text, nullable | |
| created_by | uuid | FK ke users |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Status flow:** `draft` → `dikirim` (sudah dikirim ke supplier) → `sebagian` (sebagian diterima) → `lunas` (semua diterima)

### 4.2 `purchase_order_items` — Item per PO

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | |
| po_id | uuid | FK ke purchase_orders |
| product_id | uuid | FK ke products |
| product_unit_id | uuid | FK ke product_units (satuan pesanan) |
| qty_dipesan | numeric | Jumlah dipesan (dalam satuan unit_id) |
| qty_diterima | numeric, default 0 | Akumulasi qty diterima (dalam satuan unit_id) |
| harga_beli_estimasi | numeric | Estimasi harga beli per satuan unit_id |
| catatan | text, nullable | |

### 4.3 `purchase_invoices` — Faktur Pembelian (Penerimaan Barang)

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | |
| outlet_id | uuid | FK ke outlets |
| nomor_faktur | varchar(50) | Auto-generate: `FK-{tenant_prefix}-{6digit}` |
| po_id | uuid, nullable | FK ke purchase_orders (opsional — bisa faktur tanpa PO) |
| supplier_id | uuid | FK ke suppliers |
| nomor_faktur_supplier | varchar(100), nullable | Nomor faktur dari supplier |
| tanggal_faktur | date | Tanggal faktur |
| tanggal_jatuh_tempo | date, nullable | Jatuh tempo pembayaran |
| total | numeric | Total faktur (dihitung dari item) |
| jumlah_dibayar | numeric, default 0 | Total yang sudah dibayar |
| status | enum | `draft`, `diterima`, `lunas` |
| catatan | text, nullable | |
| created_by | uuid | FK ke users |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Status flow:** `draft` → `diterima` (barang sudah masuk stok persediaan) → `lunas` (sudah bayar supplier)

### 4.4 `purchase_invoice_items` — Item per Faktur

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | |
| faktur_id | uuid | FK ke purchase_invoices |
| po_item_id | uuid, nullable | FK ke purchase_order_items (untuk trace PO mana) |
| product_id | uuid | FK ke products |
| product_unit_id | uuid | FK ke product_units (satuan penerimaan) |
| qty | numeric | Jumlah diterima (dalam satuan unit_id) |
| harga_beli | numeric | Harga beli aktual per satuan unit_id |
| subtotal | numeric, auto-calc | `qty × harga_beli` |
| nomor_batch | varchar(100) | Nomor batch/lot dari PBF |
| tanggal_kadaluarsa | date | Expiry date batch ini |
| catatan | text, nullable | |

**Rule kritis:** Begitu faktur status jadi `diterima`, setiap `purchase_invoice_items`:
1. Mencari `product_batches` dengan `nomor_batch` yang sama — jika ada, UPDATE stok; jika tidak, INSERT baris baru
2. Membuat 1 baris `stock_mutations` (tipe `masuk`)
3. Jika terkait PO, update `purchase_order_items.qty_diterima`
4. Update `products.harga_beli` ke harga terbaru
5. Semua dalam 1 database transaction

### 4.5 `purchase_returns` — Retur Pembelian

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | |
| outlet_id | uuid | FK ke outlets |
| nomor_retur | varchar(50) | Auto-generate: `RT-{tenant_prefix}-{6digit}` |
| faktur_id | uuid | FK ke purchase_invoices (faktur asal barang) |
| supplier_id | uuid | FK ke suppliers |
| tanggal_retur | date | |
| total | numeric | Total retur |
| alasan | enum | `rusak`, `salah_kirim`, `kadaluarsa`, `lainnya` |
| catatan | text, nullable | |
| created_by | uuid | FK ke users |
| created_at | timestamptz | |

### 4.6 `purchase_return_items` — Item Retur

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | |
| retur_id | uuid | FK ke purchase_returns |
| product_id | uuid | FK ke products |
| batch_id | uuid | FK ke product_batches (batch spesifik yang diretur) |
| qty | numeric | Jumlah diretur (satuan dasar) |
| alasan | text, nullable | |

**Rule:** Begitu retur disimpan, sistem otomatis:
1. Kurangi `product_batches.stok`
2. Buat `stock_mutations` (tipe `retur_keluar`)
3. Update `purchase_invoices.total` dan status hutang
4. Semua dalam 1 transaction

### 4.7 View / Query: `supplier_debt`

```sql
SELECT 
  s.id, s.nama, s.tipe,
  COUNT(pi.id) as jumlah_faktur,
  SUM(pi.total) as total_hutang,
  SUM(pi.jumlah_dibayar) as total_dibayar,
  SUM(pi.total) - SUM(pi.jumlah_dibayar) as sisa_hutang,
  MIN(pi.tanggal_jatuh_tempo) as jatuh_tempo_terdekat
FROM suppliers s
JOIN purchase_invoices pi ON pi.supplier_id = s.id 
  AND pi.tenant_id = s.tenant_id
  AND pi.status IN ('diterima')
WHERE s.tenant_id = ?
  AND pi.total - pi.jumlah_dibayar > 0
GROUP BY s.id, s.nama, s.tipe
ORDER BY sisa_hutang DESC
```

---

## 5. Business Rules

### 5.1 Purchase Order (PO)
1. `nomor_po` auto-generate: `PO-{tenant_prefix}-{6digit}`
2. PO bisa dibuat manual (pilih supplier → pilih produk → input qty) atau generate dari Defecta (prefill supplier utama + produk + qty saran)
3. PO status `draft` bisa diedit/dihapus. Begitu `dikirim` ke atas, hanya bisa diubah statusnya
4. `qty_diterima` bertambah setiap kali ada faktur masuk yang terkait PO
5. PO otomatis `lunas` ketika semua item `qty_diterima = qty_dipesan`

### 5.2 Faktur Pembelian (Penerimaan Barang)
1. Faktur bisa dibuat dengan referensi PO (menambah qty_diterima) atau tanpa PO
2. Setiap item faktur **WAJIB** mengisi: `nomor_batch` + `tanggal_kadaluarsa` (kewajiban regulasi farmasi)
3. Saat faktur jadi `diterima` → sistem otomatis:
   a. Cari `product_batches` dengan `nomor_batch` yang sama di outlet yang sama → UPDATE `stok` + `stok_awal`
   b. Jika tidak ada → INSERT baris `product_batches` baru
   c. INSERT `stock_mutations` (tipe `masuk`)
   d. UPDATE `products.harga_beli` ke harga faktur terbaru
   e. Semua atomic — jika satu gagal, rollback semua
4. Qty di faktur diinput dalam **satuan unit pilihan** (bisa box, strip, dll.) → sistem konversi otomatis ke **satuan dasar** untuk product_batches via `product_units.konversi_ke_dasar`
5. Faktur yang sudah `diterima` tidak bisa diedit — harus lewat alur Retur

### 5.3 Retur Pembelian
1. Retur merujuk ke faktur asal — sistem tahu batch mana yang diretur
2. Otomatis mengurangi `product_batches.stok` batch tersebut
3. Membuat `stock_mutations` (tipe `retur_keluar`)
4. Tidak bisa retur lebih dari stok batch yang tersedia
5. Total retur mengurangi hutang supplier (mengubah `sisa_hutang`)

### 5.4 Hutang Supplier
1. Otomatis tercatat dari faktur dengan status `diterima` dan `total > jumlah_dibayar`
2. `jumlah_dibayar` di-update manual oleh Owner saat pembayaran dilakukan (terhubung ke modul Keuangan nanti)
3. Untuk MVP: tracking hutang berupa view + laporan sederhana. Pembayaran dicatat sebagai update `purchase_invoices.jumlah_dibayar`
4. Faktur `lunas` ketika `jumlah_dibayar >= total`

---

## 6. Alur Pengguna (Frontend Flow)

### 6.1 Struktur Halaman

```
┌─────────────────────────────────────────────────────────┐
│  TOP BAR                                                │
├──────────┬──────────────────────────────────────────────┤
│ SIDEBAR  │  KONTEN UTAMA                                │
│          │                                              │
│ 📋 PO    │  [Daftar PO / Form PO / Daftar Faktur]      │
│ 📦 Faktur│                                              │
│ ↩️ Retur │                                              │
│ 💰 Hutang│                                              │
│ 📜 Riway.│                                              │
└──────────┴──────────────────────────────────────────────┘
```

### 6.2 Daftar Purchase Order (Tab PO)

Tabel: Nomor PO, Supplier, Tanggal, Total Item, Status (badge: draft/dikirim/sebagian/lunas), Aksi

| Nomor | Supplier | Tanggal | Item | Status | Aksi |
|-------|----------|---------|------|--------|------|
| PO-000001 | Kimia Farma | 19 Jun | 5 (3/5) | 🟡 Sebagian | [Terima] [Lihat] |
| PO-000002 | Indofarma | 18 Jun | 2 | ✉️ Dikirim | [Terima] [Lihat] |
| PO-000003 | Anugrah Argon | 17 Jun | 8 (8/8) | ✅ Lunas | [Lihat] |

Tombol: **[+ Buat PO Baru]** **[Generate dari Defecta]**

### 6.3 Form PO (Slide-over / Full page)

```
┌──────────────────────────────────────────┐
│  Purchase Order Baru                     │
│  ────────────────────────────────────── │
│                                          │
│  Supplier *   [Kimia Farma          ▾]  │
│  Tanggal      [19/06/2026]              │
│  Catatan      [_____________]           │
│                                          │
│  Item Pesanan:                           │
│  ┌────────────────────────────────────┐ │
│  │ [+ Tambah Produk]                  │ │
│  ├────────────────────────────────────┤ │
│  │ Paracetamol 500mg                  │ │
│  │ Qty: [5] [Box (100 tab) ▾]        │ │
│  │ Est. Harga: Rp [350.000]/box      │ │
│  │                                  ✕│ │
│  ├────────────────────────────────────┤ │
│  │ Amoxicillin 500mg                  │ │
│  │ Qty: [3] [Box (100 kaps) ▾]       │ │
│  │ Est. Harga: Rp [900.000]/box      │ │
│  │                                  ✕│ │
│  └────────────────────────────────────┘ │
│                                          │
│  Total Estimasi: Rp 4.450.000           │
│                                          │
│  ┌──────────┐  ┌──────────────────────┐ │
│  │ Simpan   │  │ Simpan & Kirim       │ │
│  │ Draft    │  │ ke Supplier          │ │
│  └──────────┘  └──────────────────────┘ │
└──────────────────────────────────────────┘
```

### 6.4 Penerimaan Barang / Input Faktur

Flow: klik "Terima" di baris PO → buka form penerimaan:

```
┌──────────────────────────────────────────┐
│  Penerimaan Barang — PO-000001           │
│  Supplier: Kimia Farma | 19 Jun 2026     │
│  ────────────────────────────────────── │
│                                          │
│  No. Faktur Supplier [INV/2026/0456]    │
│  Tgl. Faktur         [19/06/2026]       │
│  Jatuh Tempo         [19/07/2026]       │
│                                          │
│  Item Diterima:                          │
│  ┌────────────────────────────────────┐ │
│  │ ✓ Paracetamol 500mg               │ │
│  │   Dipesan: 5 Box | Diterima: [3] Box│ │
│  │   Harga Aktual: Rp [352.000]/box   │ │
│  │   ──────────────────────────────  │ │
│  │   Batch #1:                        │ │
│  │   No. Batch [BN-2026-018]  ✕      │ │
│  │   Expiry    [15/12/2028]           │ │
│  │   Qty       [2] Box               │ │
│  │   [+ Tambah Batch]                │ │
│  │   ──────────────────────────────  │ │
│  │   Batch #2:                        │ │
│  │   No. Batch [BN-2026-019]  ✕      │ │
│  │   Expiry    [20/12/2028]           │ │
│  │   Qty       [1] Box               │ │
│  └────────────────────────────────────┘ │
│                                          │
│  Total Faktur: Rp 1.056.000             │
│                                          │
│  ┌──────────┐  ┌──────────────────────┐ │
│  │  Draft   │  │  ✅ Terima Barang    │ │
│  └──────────┘  └──────────────────────┘ │
└──────────────────────────────────────────┘
```

**Poin kunci:**
- 1 item PO bisa diterima dalam beberapa batch berbeda (split batch)
- Harga aktual bisa berbeda dari estimasi PO
- Qty diterima ≤ qty dipesan
- "Terima Barang" → trigger atomic stock mutation

### 6.5 Daftar Faktur (Tab Faktur)

Tabel: Nomor Faktur, Supplier, Tanggal, Total, Dibayar, Sisa, Status (draft/diterima/lunas), Aksi

### 6.6 Retur Pembelian (Tab Retur)

```
┌──────────────────────────────────────────┐
│  Retur Pembelian Baru                    │
│  ────────────────────────────────────── │
│  Faktur Asal * [FK-000042 (Kimia Far▾]  │
│  Tanggal        [19/06/2026]            │
│  Alasan *       [▾ Rusak / Pecah]       │
│                                          │
│  Item Retur:                             │
│  ┌────────────────────────────────────┐ │
│  │ Paracetamol 500mg                  │ │
│  │ Batch: [BN-2026-018 (Stok:25) ▾]  │ │
│  │ Qty Retur: [1] Box                │ │
│  │                                  ✕│ │
│  └────────────────────────────────────┘ │
│                                          │
│  Total Retur: Rp 352.000                │
│                                          │
│  ┌──────────┐  ┌──────────────────────┐ │
│  │  Batal   │  │   Simpan Retur       │ │
│  └──────────┘  └──────────────────────┘ │
└──────────────────────────────────────────┘
```

### 6.7 Hutang Supplier (Tab Hutang)

> 🤖 **Auto-generated** — tidak ada input manual. Data berasal dari view `supplier_debt` (Bagian 4.7). Satu-satunya input manual: Owner update `purchase_invoices.jumlah_dibayar` saat pembayaran ke supplier.

Tabel: Supplier, Jml Faktur, Total Hutang, Dibayar, Sisa, Jatuh Tempo Terdekat

### 6.8 Riwayat Pembelian (Tab Riwayat)

> 🤖 **Auto-generated** — tidak ada input manual. Data berasal dari UNION query `purchase_orders` + `purchase_invoices` + `purchase_returns`, difilter per supplier & rentang tanggal. Auto terisi setiap ada transaksi baru di modul ini.

---

## 7. Build Prompt (Siap Pakai)

```
Saya sedang membangun modul "Pembelian (Purchasing)" untuk aplikasi POS apotek
berbasis web, multi-tenant SaaS, menggunakan [STACK]. Database: PostgreSQL (Supabase).

KONTEKS:
- Multi-tenant: semua tabel wajib tenant_id + RLS
- 3 role: owner, admin, kasir (akses terbatas — lihat Bagian 3)
- Tabel products, product_units, product_suppliers, suppliers sudah ada (Master Data)
- Tabel product_batches, stock_mutations sudah ada (Persediaan)
- Fungsi atomic stock mutation sudah ada (dari modul Persediaan)

TUGAS:

1. SKEMA DATABASE
   Buat migration untuk: purchase_orders, purchase_order_items, purchase_invoices,
   purchase_invoice_items, purchase_returns, purchase_return_items.
   Ikuti skema di PRD Bagian 4.

   RLS policy:
   - Kasir: NO ACCESS (tidak bisa lihat data pembelian)
   - Admin: full CRUD kecuali update jumlah_dibayar di purchase_invoices
   - Owner: full CRUD termasuk update jumlah_dibayar

2. BACKEND LOGIC
   a. **Auto-generate nomor dokumen:**
      - PO: `PO-{prefix}-{6digit}`
      - Faktur: `FK-{prefix}-{6digit}`
      - Retur: `RT-{prefix}-{6digit}`

   b. **Penerimaan barang (atomic stock-in):**
      - Endpoint: `receive_invoice(faktur_id)`
      - Untuk setiap purchase_invoice_item:
        1. Cari product_batch dengan nomor_batch yg sama di outlet yg sama
        2. Jika ada: UPDATE stok = stok + qty_dasar, stok_awal = stok_awal + qty_dasar
        3. Jika tidak: INSERT product_batches baru
        4. INSERT stock_mutations (tipe='masuk')
        5. UPDATE products.harga_beli = harga beli terbaru
        6. Jika ada po_item_id: UPDATE purchase_order_items.qty_diterima
        7. Jika semua item PO sudah qty_diterima = qty_dipesan → PO status = 'lunas'
        8. Jika sebagian → PO status = 'sebagian'
      - Semua dalam 1 transaction (SELECT FOR UPDATE untuk product_batches)
      - Update faktur status jadi 'diterima'

   c. **Retur (atomic stock-out):**
      - Kurangi product_batches.stok
      - INSERT stock_mutations (tipe='retur_keluar')
      - Update sisa hutang dari faktur terkait

   d. **Query supplier debt** sesuai Bagian 4.7

3. FRONTEND
   Halaman admin dengan sidebar navigasi: PO, Faktur, Retur, Hutang, Riwayat

   a. **Daftar PO** — tabel dengan badge status (draft/dikirim/sebagian/lunas),
      search & filter supplier, tombol "Generate dari Defecta" (buka dialog isi
      otomatis dari data defecta di modul Persediaan), klik baris → form detail

   b. **Form PO** — pilih supplier, tambah item (search produk, pilih satuan,
      input qty & estimasi harga), total otomatis, tombol "Simpan Draft" &
      "Simpan & Kirim"

   c. **Penerimaan Barang** — dari daftar PO klik "Terima" atau input faktur
      tanpa PO. Form: input no faktur supplier, tanggal, jatuh tempo, lalu
      per item PO: input qty diterima (otomatis ≤ sisa), harga aktual,
      dan yang PENTING: sub-form batch (bisa multiple batch per item — setiap
      batch isi nomor batch + expiry + qty)

   d. **Daftar Faktur** — tabel dengan status, filter supplier, klik → detail
   e. **Retur** — form retur: pilih faktur asal → pilih item → pilih batch →
      input qty retur → simpan
   f. **Hutang Supplier** — tabel ringkasan hutang per supplier
   g. **Riwayat Pembelian** — gabungan PO + faktur, filter tanggal & supplier

MULAI DARI:
a) Skema database + migration
b) Backend: fungsi receive_invoice (atomic stock-in) — ini paling kritikal
c) Baru frontend
```

---

## 8. Catatan Integrasi

- **Ke modul Persediaan:** `receive_invoice()` memanggil fungsi atomic stock mutation yang sudah ada. Jika fungsi belum ada, implementasikan langsung di endpoint ini dengan SELECT FOR UPDATE.
- **Ke modul Defecta:** "Generate dari Defecta" membaca daftar defecta dari modul Persediaan (query yang sudah menghitung lead time & urgency) → prefill PO dengan supplier utama + qty yang disarankan.
- **Ke modul Keuangan (Fase 2):** `purchase_invoices.jumlah_dibayar` akan di-update dari modul Keuangan, bukan langsung. Untuk MVP, Owner bisa update manual dari halaman faktur.
