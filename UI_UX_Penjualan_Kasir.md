# UI/UX Design — Modul Penjualan (Kasir)
### Bagian dari: Sistem POS & ERP Apotek
Versi: 1.0 | Tanggal: 19 Juni 2026

---

## Design System

Sumber: generated via `ui-ux-pro-max` skill berdasarkan konteks "pharmacy POS healthcare SaaS dashboard"

### Style
- **Arah:** Accessible & Ethical — high contrast, large text (16px+), keyboard navigation friendly, WCAG AA minimum
- **Estetika:** Data-Dense Dashboard — efisien ruang, KPI cards, tabel/table, grid layout, padding minimal (8-12px), maksimum informasi per cm² layar
- **Tidak pakai:** emoji sebagai ikon, animasi berlebihan, neon, gradien purple/pink AI

### Colors
| Role | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| Primary | `#15803D` | `green-700` | Tombol utama, badge, active states |
| Secondary | `#22C55E` | `green-500` | Success states, stock "tersedia" indicator |
| CTA/Accent | `#0369A1` | `sky-700` | Link, bayar, action items |
| Background | `#F0FDF4` | `green-50` | Page background |
| Surface | `#FFFFFF` | `white` | Cards, sidebar, modals |
| Text Primary | `#14532D` | `green-900` | Heading & body text |
| Text Secondary | `#166534` | `green-800` | Labels, secondary info |
| Danger | `#DC2626` | `red-600` | "Wajib Resep", error, void |
| Warning | `#D97706` | `amber-600` | Expiry warning, stock low |
| Border | `#D1D5DB` | `gray-300` | Card borders, dividers |

### Typography
| Role | Font | Weight | Size |
|------|------|--------|------|
| Heading | Fira Code | 600-700 | 16-20px |
| Body | Fira Sans | 400-500 | 14-16px |
| Mono (price/qty) | Fira Code | 500 | 14-16px |
| Small labels | Fira Sans | 400 | 12px |
| **CSS Import:** | | | |
`@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');`

### Spacing & Layout
- Container max-width: `max-w-full` (POS layar lebar)
- Sidebar width: `w-96` (384px) — kanan
- Grid product: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`
- Gap: `gap-3` antar card
- Card padding: `p-3`
- Touch target minimum: `44px × 44px` (h-11 w-11 pada tombol ikon)
- Responsive breakpoints: 768px (tablet), 1024px (desktop), 1440px (wide)

### Effects
- Focus ring: `focus:ring-2 focus:ring-green-500 focus:ring-offset-2`
- Hover cards: `hover:bg-green-50 hover:border-green-300 transition-colors duration-150`
- Hover buttons: `hover:brightness-95 transition duration-150`
- Active (press): `active:scale-[0.98]`
- Loading: skeleton pulse animation
- Modal: backdrop blur `backdrop-blur-sm`

---

## Screen Layout — Halaman Kasir

```
┌──────────────────────────────────────────────────────────────┬─────────────┐
│  TOP BAR: logo | outlet | shift status | user | clock       │             │
├──────────────────────────────────────────────────────────────┤             │
│                                                              │  KERANJANG  │
│  ┌─────────────────────────────────────────┐ ┌────────────┐ │  ┌────────┐ │
│  │ 🔍 Cari obat atau scan barcode...  [📷] │ │ Filter OTC │ │  │Item x3 │ │
│  └─────────────────────────────────────────┘ │ Filter Keras│ │  │        │ │
│                                              │ Filter Semua│ │  │Paracet│ │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌─────┐              │ │  │500mg  │ │
│  │      │ │      │ │      │ │      │ │     │              │ │  │2x Rp  │ │
│  │Parac.│ │Amox. │ │OBH  │ │Betad.│ │ ... │              │ │  │8.000  │ │
│  │Rp 5K │ │Rp 12K│ │Rp 18K│ │Rp 22K│ │     │              │ │  │ [+][-]│ │
│  │ Stok │ │ Stok │ │ Stok │ │ Stok │ │     │              │ │  │        │ │
│  │  45  │ │  12  │ │  30  │ │  8   │ │     │              │ │  ├────────┤ │
│  └──────┘ └──────┘ └──────┘ └──────┘ └─────┘              │ │  │Amox.  │ │
│                                                              │  │500mg ⚠│ │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌─────┐              │ │  │Resep— │ │
│  │      │ │      │ │      │ │      │ │     │              │ │  │Budi   │ │
│  │      │ │      │ │      │ │      │ │     │              │ │  │1x Rp  │ │
│  │      │ │      │ │      │ │      │ │     │              │ │  │12.000 │ │
│  │      │ │      │ │      │ │      │ │     │              │ │  │ [+][-]│ │
│  └──────┘ └──────┘ └──────┘ └──────┘ └─────┘              │ │  ├────────┤ │
│                                                              │  │        │ │
│                                                              │  │        │ │
│                                                              │  │        │ │
│                                                              │  ├────────┤ │
│                                                              │  │Subtotal│ │
│                                                              │  │Rp28.000│ │
│                                                              │  │        │ │
│                                                              │  │[+ Resep│ │
│                                                              │  │        │ │
│                                                              │  │ WAIT   │ │
│                                                              │  │Apoteker│ │
│                                                              │  │ [BAYAR]│ │
│                                                              │  └────────┘ │
└──────────────────────────────────────────────────────────────┴─────────────┘
```

---

## 1. Top Bar (App Header)

| Element | Detail |
|---------|--------|
| **Logo / Nama App** | Kiri atas, link ke dashboard |
| **Outlet selector** | Dropdown jika user punya akses multi-outlet |
| **Shift info** | Badge hijau "Shift Aktif" / abu-abu "Belum Buka Shift", klik → dialog buka/tutup shift |
| **Shift timer** | Durasi shift berjalan (opsional) |
| **User avatar + nama** | Kanan atas, dropdown: profil, logout |
| **Role badge** | Di samping nama: `Kasir` / `Admin` / `Owner` |

**Tinggi bar:** 56px (`h-14`)
**Background:** `bg-white border-b border-gray-200`
**Position:** `sticky top-0 z-40`

---

## 2. Kolom Kiri — Pencarian & Grid Produk

### 2.1 Search Bar

```
┌──────────────────────────────────────────────────┬──────┐
│ 🔍  Cari nama obat, kode, atau barcode...       │ [📷] │
└──────────────────────────────────────────────────┴──────┘
```

- **Input:** autofocus saat halaman load, `type="search"`, debounce 300ms
- **Icon kaca pembesar** di kiri (Heroicons `magnifying-glass`)
- **Tombol kamera/barcode** (Heroicons `qr-code`) → trigger kamera untuk scan barcode, atau input manual kode barcode
- **Hasil pencarian:** muncul di grid yang sama (menggantikan tampilan "semua produk"), dengan highlight match di nama

### 2.2 Category Filter Pills

```
[Semua] [Obat Bebas] [Obat Keras] [Vitamin] [Alkes] [Obat Herbal]
```

- Horizontal scrollable pills
- Default: "Semua" aktif
- Klik kategori → filter grid produk
- Active pill: `bg-green-700 text-white`, inactive: `bg-white border border-gray-300 text-green-900`

### 2.3 Product Grid Card

Setiap card produk menampilkan:

```
┌─────────────────┐
│                 │       ═══  Card Structure  ═══
│   [Gambar]      │
│                 │       Tinggi: 180-200px
│                 │       Lebar: menyesuaikan grid column
├─────────────────┤
│ Nama Produk     │       font: Fira Sans 500, 14px, green-900
│ Paracetamol...  │       max 2 baris, truncate dengan "..."
├─────────────────┤
│ Rp 5.000  [45]  │       harga: Fira Code 600, 16px, green-900
│                 │       stok: badge kecil di kanan
└─────────────────┘
```

**States:**

| State | Visual |
|-------|--------|
| **Normal (OTC)** | Card putih, border gray-200, hover: bg-green-50 border-green-300 |
| **Obat Keras** | Badge merah `⚠ Wajib Resep` di pojok kanan atas card, border kiri merah |
| **Stok Habis** | Overlay semi-transparan + teks "Stok Habis", card tidak bisa diklik |
| **Stok Menipis (<10)** | Badge amber `⚠ Stok: 3` |
| **Sudah di Keranjang** | Checkmark hijau di pojok + border hijau, quantity badge |
| **Loading** | Skeleton card (abu-abu pulse) |

**Aksi klik produk:**
- **OTC + stok > 0:** tambah langsung ke keranjang (qty 1), tampilkan toast singkat "Paracetamol ditambahkan"
- **OTC + stok > 0 + SUDAH di keranjang:** tampilkan mini quantity picker inline (+/-)
- **Obat Keras + belum ada resep:** arahkan ke flow "Tambah dari Resep" (Bagian 4.3 PRD)
- **Obat Keras + sudah ada resep di keranjang:** tambah item dengan tag "Resep"

### 2.4 Empty State (Tidak ada hasil pencarian)

```
┌─────────────────────────────────────────────┐
│                                             │
│              [🔍 icon besar]                │
│                                             │
│       Tidak ada produk ditemukan            │
│    Coba kata kunci lain atau scan barcode   │
│                                             │
└─────────────────────────────────────────────┘
```

### 2.5 Loading State

Grid skeleton cards (8-10 card) dengan animasi pulse, meniru bentuk card asli.

---

## 3. Kolom Kanan — Keranjang (Sidebar)

Sidebar tetap (`sticky top-14 right-0`, tinggi `h-[calc(100vh-56px)]`), lebar 384px (`w-96`).

### 3.1 Header Keranjang

```
┌──────────────────────────────────┐
│ 🛒 Keranjang            (3 item) │
│ ──────────────────────────────── │
```

### 3.2 Item Keranjang

```
┌──────────────────────────────────┐
│ Paracetamol 500mg          ✕     │
│ Rp 5.000 × 2 = Rp 10.000        │
│ [-]  2  [+]                      │
├──────────────────────────────────┤
│ Amoxicillin 500mg   ⚠ Wajib Resep│
│ Resep — Budi Santoso    ✕        │
│ Rp 12.000 × 1 = Rp 12.000       │
│ [-]  1  [+]                      │
├──────────────────────────────────┤
│ OBH Combi                      ✕ │
│ Rp 18.000 × 1 = Rp 18.000       │
│ [-]  1  [+]                      │
├──────────────────────────────────┤
│                                  │
│  ──────────────────────────────  │
│  Subtotal           Rp 40.000   │
│  ──────────────────────────────  │
│  Total              Rp 40.000   │
│                                  │
│  [+ Tambah dari Resep]           │
│                                  │
│  ┌──────────────────────────┐   │
│  │  🔒 Menunggu Validasi    │   │
│  │     Apoteker             │   │
│  └──────────────────────────┘   │
│                                  │
│  ┌──────────────────────────┐   │
│  │       BAYAR              │   │
│  └──────────────────────────┘   │
└──────────────────────────────────┘
```

**Aturan tombol Bayar:**
- Keranjang kosong → tombol disabled, teks "Keranjang Kosong"
- Ada item keras TANPA validasi → tombol disabled, teks "Menunggu Validasi Apoteker", muncul tombol "Validasi & Lanjutkan" (hanya untuk Admin/Owner)
- Semua valid → tombol hijau aktif "BAYAR — Rp 40.000"

### 3.3 Empty Cart

```
┌──────────────────────────────────┐
│                                  │
│          [🛒 icon besar]         │
│                                  │
│        Keranjang kosong          │
│   Cari produk atau tambah resep  │
│                                  │
│    [+ Tambah dari Resep]         │
│                                  │
└──────────────────────────────────┘
```

### 3.4 "Tambah dari Resep" Button

Tombol sekunder di atas tombol Bayar, icon `document-plus` (Heroicons).
Klik membuka **slide-over panel** dari kanan (atau modal dialog).

---

## 4. Slide-Over — Tambah dari Resep

Panel lebar 480px (`w-[480px]`), geser dari kanan, overlay backdrop di belakang.

### 4.1 Header

```
┌──────────────────────────────────────┐
│ ←  Tambah dari Resep                 │
│ ──────────────────────────────────── │
│ [Resep Baru]   [Resep Existing]      │  ← Tab
├──────────────────────────────────────┤
```

### 4.2 Tab "Resep Baru"

```
│ Pasien *                             │
│ ┌──────────────────────────────────┐ │
│ │ Cari atau input nama pasien... ▾ │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Dokter                               │
│ ┌──────────────────────────────────┐ │
│ │ Cari atau input dokter... ▾      │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Tanggal Resep *                      │
│ ┌──────────────────────────────────┐ │
│ │ 📅 19/06/2026                    │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Obat yang Diresepkan *               │
│ ┌──────────────────────────────────┐ │
│ │ + Tambah Obat                    │ │
│ ├──────────────────────────────────┤ │
│ │ Paracetamol 500mg   10 tab  ✕   │ │
│ │ Amoxicillin 500mg   15 kaps ✕   │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │       Tambah ke Keranjang        │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

**Alur "Tambah Obat":**
1. Klik "+ Tambah Obat" → search input muncul di dalam panel
2. Cari & pilih produk → input qty yang diresepkan → tambah ke daftar
3. Bisa add multiple obat sebelum "Tambah ke Keranjang"

**Setelah "Tambah ke Keranjang":**
- Semua item resep ditambahkan ke sidebar keranjang dengan tag "Resep — [nama pasien]"
- Panel tertutup, kembali ke halaman kasir utama
- Untuk tiap item, kasir bisa adjust qty yang ditebus SEKARANG (≤ qty_diresepkan) via tombol +/- di keranjang

### 4.3 Tab "Resep Existing"

```
│ Cari Resep                           │
│ ┌──────────────────────────────────┐ │
│ │ 🔍 Nama pasien atau no. resep... │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Hasil:                               │
│ ┌──────────────────────────────────┐ │
│ │ Resep #RX-20260619-001    ⚡ 3/5 │ │ ← status badge
│ │ Budi Santoso                     │ │
│ │ 19 Jun 2026 · Dr. Andi           │ │
│ │                                  │ │
│ │ Paracetamol   5/10 tab ditebus   │ │ ← progress bar
│ │ Amoxicillin   0/15 kaps ditebus  │ │
│ │                             [Pilih]│ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

- Item yang sudah lunas (`qty_sudah_ditebus = qty_diresepkan`): abu-abu di-strikethrough, tidak bisa dipilih
- Item yang belum/sebagian: bisa dipilih, akan ditambahkan ke keranjang dengan sisa yang bisa ditebus

---

## 5. Dialog Validasi Apoteker

Hanya muncul jika yang login adalah **Admin/Owner** dan keranjang berisi item keras.

```
┌──────────────────────────────────────┐
│                                      │
│        ⚠  Validasi Apoteker          │
│                                      │
│  Transaksi ini mengandung obat       │
│  golongan keras/narkotika yang       │
│  memerlukan validasi apoteker.       │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ Amoxicillin 500mg            │   │
│  │ 1 × Rp 12.000               │   │
│  └──────────────────────────────┘   │
│                                      │
│  Dengan klik "Validasi", Anda       │
│  bertanggung jawab secara hukum     │
│  atas pelepasan obat ini.           │
│                                      │
│  ┌──────────┐  ┌──────────────────┐ │
│  │  Batal   │  │  ✅ Validasi &   │ │
│  │          │  │     Lanjutkan    │ │
│  └──────────┘  └──────────────────┘ │
└──────────────────────────────────────┘
```

**Setelah validasi:** tombol "Bayar" di sidebar aktif. Record `prescription_validations` tersimpan.

### Behavior untuk Kasir biasa:

Jika yang login **Kasir** dan keranjang berisi item keras:
- Tombol "Bayar" tetap disabled bertuliskan "Menunggu Validasi Apoteker"
- **Tidak ada tombol "Minta Validasi"** — kasir harus logout, Admin login untuk lanjutkan transaksi
- Tooltip: "Hubungi apoteker untuk login dan validasi transaksi ini"

---

## 6. Dialog Pembayaran (Modal)

Modal center-screen dengan backdrop.

### 6.1 Layar Utama Pembayaran

```
┌──────────────────────────────────────────┐
│  Pembayaran                    ✕         │
│ ─────────────────────────────────────────│
│                                          │
│  Total Tagihan                          │
│  Rp 40.000                              │  ← Besar, Fira Code bold
│                                          │
│  Metode Pembayaran                       │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│  │ 💵   │ │ 📱   │ │ 💳   │ │ 📲   │   │  ← Radio card
│  │Tunai │ │QRIS  │ │Debit/│ │E-Wal.│   │
│  │      │ │      │ │Kredit│ │      │   │
│  └──────┘ └──────┘ └──────┘ └──────┘   │
│                                          │
│  ── Jika Tunai dipilih ──               │
│  Jumlah Diterima                         │
│  ┌──────────────────────────────────┐   │
│  │ Rp 50.000                        │   │  ← Auto-focus, input angka
│  └──────────────────────────────────┘   │
│                                          │
│  Kembalian                              │
│  Rp 10.000                              │  ← Hijau, muncul auto setelah input
│                                          │
│  ── Jika Non-Tunai dipilih ──           │
│  Status: [ ] Tandai Sudah Dibayar       │  ← Checkbox manual
│  Catatan (opsional)                     │
│  ┌──────────────────────────────────┐   │
│  │ Ref: 1234567890                  │   │
│  └──────────────────────────────────┘   │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │      SELESAIKAN TRANSAKSI        │   │  ← Primary CTA
│  └──────────────────────────────────┘   │
└──────────────────────────────────────────┘
```

**Validasi:**
- Tunai: `jumlah_dibayar ≥ total` wajib, kalau kurang → field merah + pesan error
- Non-tunai: checkbox "Tandai Sudah Dibayar" wajib dicentang
- Tombol "Selesaikan Transaksi" disabled sampai validasi terpenuhi

**E-wallet sub-select:**
Saat E-wallet dipilih, muncul radio/select di bawahnya: `GoPay | OVO | DANA`

### 6.2 Konfirmasi Sebelum Proses

Sebelum benar-benar submit ke backend, tampilkan konfirmasi singkat:

```
┌──────────────────────────────────┐
│  Konfirmasi Transaksi?           │
│                                  │
│  Total: Rp 40.000                │
│  Metode: Tunai                   │
│  Diterima: Rp 50.000             │
│  Kembalian: Rp 10.000            │
│                                  │
│  [Batal]    [Ya, Proses]        │
└──────────────────────────────────┘
```

### 6.3 Loading State (saat proses checkout)

```
┌──────────────────────────────────┐
│                                  │
│       ⏳ Memproses...            │
│                                  │
│   Mohon tunggu, transaksi        │
│   sedang diproses                │
│                                  │
└──────────────────────────────────┘
```

Seluruh UI freeze, tidak bisa ditutup/dibatalkan (mencegah double submit).

### 6.4 Error State

```
┌──────────────────────────────────┐
│  ❌ Gagal                         │
│                                  │
│  Stok Amoxicillin tidak cukup.   │
│  Tersedia: 5, diminta: 10        │
│                                  │
│  ┌──────────────────────────────┐│
│  │        Coba Lagi             ││
│  └──────────────────────────────┘│
└──────────────────────────────────┘
```

- Stok bisa berubah antara user lihat grid dan klik checkout (race condition)
- Error message jelas: produk mana, butuh berapa vs tersedia berapa

---

## 7. Post-Checkout — Sukses & Cetak Struk

### 7.1 Success Screen

```
┌──────────────────────────────────────────┐
│                                          │
│           ✅  Transaksi Berhasil          │
│                                          │
│          No. Transaksi                    │
│          #TRX-20260619-0042               │
│                                          │
│          Total: Rp 40.000                │
│          Dibayar: Tunai                  │
│          19 Jun 2026, 14:32              │
│                                          │
│  ┌────────────────┐ ┌────────────────┐  │
│  │ 🖨️ Cetak Struk │ │ 📱 Kirim       │  │
│  │   Thermal      │ │   Digital (PDF)│  │
│  └────────────────┘ └────────────────┘  │
│                                          │
│  ┌────────────────┐ ┌────────────────┐  │
│  │ 📊 Lihat Detail│ │ 🆕 Transaksi   │  │
│  │   Transaksi    │ │   Baru         │  │
│  └────────────────┘ └────────────────┘  │
└──────────────────────────────────────────┘
```

### 7.2 Cetak Thermal

- Trigger `window.print()` dengan CSS `@media print` khusus
- Layout struk: lebar 58mm, font monospace, ringkas
- Content: nama apotek, alamat, tanggal, no transaksi, daftar item (nama, qty, harga, subtotal), total, metode bayar

### 7.3 Kirim Digital (PDF)

- Generate PDF di backend → return URL download
- Tampilkan dialog kecil:

```
┌──────────────────────────────────┐
│  Kirim Struk Digital             │
│                                  │
│  📎 Struk_TRX-0042.pdf          │
│     [Unduh PDF]                  │
│                                  │
│  Nomor WA Pelanggan              │
│  ┌──────────────────────────────┐│
│  │ 081234567890                  ││
│  └──────────────────────────────┘│
│                                  │
│  ┌──────────┐ ┌────────────────┐ │
│  │  Tutup   │ │ 📱 Kirim via   │ │
│  │          │ │    WhatsApp    │ │
│  └──────────┘ └────────────────┘ │
└──────────────────────────────────┘
```

- "Kirim via WhatsApp" → buka `https://wa.me/6281234567890?text=...` dengan link download PDF

---

## 8. Shift — Buka & Tutup

### 8.1 Dialog Buka Shift

Dipicu saat: user login & belum ada shift aktif, atau klik badge shift di top bar.

```
┌──────────────────────────────────────┐
│  Buka Shift                          │
│ ──────────────────────────────────── │
│                                      │
│  Selamat datang, Kasir!              │
│  Silakan input modal awal shift.     │
│                                      │
│  Modal Awal                          │
│  ┌──────────────────────────────────┐│
│  │ Rp [_____________]              ││
│  └──────────────────────────────────┘│
│                                      │
│  ┌──────────────────────────────────┐│
│  │          BUKA SHIFT             ││
│  └──────────────────────────────────┘│
└──────────────────────────────────────┘
```

### 8.2 Dialog Tutup Shift

```
┌──────────────────────────────────────┐
│  Tutup Shift                         │
│ ──────────────────────────────────── │
│                                      │
│  Modal Awal:      Rp 100.000        │
│  Total Transaksi: Rp 1.250.000      │
│  ────────────────────────────────── │
│  Seharusnya di kas: Rp 1.350.000    │
│                                      │
│  Kas Akhir (dihitung fisik)          │
│  ┌──────────────────────────────────┐│
│  │ Rp [_____________]              ││
│  └──────────────────────────────────┘│
│                                      │
│  Selisih: -Rp 15.000                 │ ← Merah jika minus
│                                      │
│  Catatan                             │
│  ┌──────────────────────────────────┐│
│  │ [_____________]                  ││
│  └──────────────────────────────────┘│
│                                      │
│  ┌───────────┐ ┌───────────────────┐ │
│  │  Batal    │ │   TUTUP SHIFT    │ │
│  └───────────┘ └───────────────────┘ │
└──────────────────────────────────────┘
```

---

## 9. UI States Summary

| State | Trigger | Visual |
|-------|---------|--------|
| **Shift belum aktif** | User baru login, belum buka shift | Semua produk grid disabled + overlay "Buka Shift dulu", tombol buka shift di tengah layar |
| **Keranjang kosong** | Transaksi baru / habis checkout | Empty cart illustration di sidebar |
| **Menunggu validasi** | Keranjang ada item keras, belum divalidasi | Tombol Bayar disabled grey, label "Menunggu Validasi Apoteker" |
| **Validasi ada, role Kasir** | Login Kasir, item keras di keranjang | Tombol Bayar disabled, tooltip "Butuh login Admin" |
| **Checkout loading** | Sedang proses checkout | Full modal loading, tidak bisa close |
| **Checkout sukses** | Transaksi berhasil | Success screen dengan opsi cetak/baru |
| **Checkout gagal** | Error server / stok habis | Error modal dengan detail & tombol "Coba Lagi" |
| **Stok habis di card** | Batch FEFO habis | Card abu-abu overlay "Stok Habis" |
| **Produk tidak ditemukan** | Search no results | Empty state di area grid |
| **Loading data** | Fetch produk / resep | Skeleton cards |
| **Koneksi terputus** | Internet mati | Banner kuning di top "Koneksi terputus. Data disimpan lokal." |

---

## 10. Responsive Behavior

### Desktop (≥1024px)
- Layout 2 kolom penuh
- Grid produk 4-5 kolom
- Sidebar 384px

### Tablet (768px - 1023px)
- Layout tetap 2 kolom
- Grid produk 3 kolom
- Sidebar 320px (`w-80`)

### Tablet Portrait / HP Besar (576px - 767px)
- Grid produk 2 kolom
- Sidebar jadi bottom sheet / drawer (toggleable)
- Tombol floating "🛒 (3) Rp 40.000" di bawah

### Mobile Kecil (<576px)
- Single column, sidebar disembunyikan
- Grid 1-2 kolom
- Tap produk → mini sheet quantity picker
- Cart sebagai bottom sheet full-width, swipe up
- Bottom bar: "🛒 3 item · Rp 40.000 [Bayar]"

---

## 11. Accessibility Checklist

- [ ] Semua interactive element punya `cursor-pointer`
- [ ] Focus ring terlihat (`focus:ring-2 focus:ring-green-500`) di semua input, button, select
- [ ] Label di semua form input (explicit `<label>` atau `aria-label`)
- [ ] Color bukan satu-satunya indikator (badge + teks + ikon)
- [ ] `prefers-reduced-motion` dihormati (ganti animasi dengan instant transition)
- [ ] Touch target ≥ 44×44px untuk semua tombol
- [ ] Tab order masuk akal: search → filter → grid → sidebar → bayar
- [ ] Skip link "Langsung ke keranjang" di awal halaman
- [ ] Teks minimum 14px untuk body, 12px untuk label sekunder
- [ ] Kontras teks 4.5:1 minimum

---

## 12. Icon Set

Gunakan **Heroicons** (24px solid/outline, konsisten seluruh modul):

| Icon | Nama Heroicons | Penggunaan |
|------|---------------|------------|
| 🔍 | `magnifying-glass` | Search bar |
| 📷 | `camera` / `qr-code` | Scan barcode |
| 🛒 | `shopping-cart` | Keranjang |
| ✕ | `x-mark` | Hapus item, close modal |
| ➕ | `plus` / `plus-circle` | Tambah item, tambah obat |
| ➖ | `minus` / `minus-circle` | Kurangi qty |
| 📄 | `document-plus` | Tambah dari resep |
| 💵 | `banknotes` | Pembayaran tunai |
| 📱 | `device-phone-mobile` | QRIS / E-wallet |
| 💳 | `credit-card` | Debit/kredit |
| ✅ | `check` / `check-circle` | Validasi, konfirmasi |
| ⚠ | `exclamation-triangle` | Peringatan, wajib resep |
| 🔒 | `lock-closed` | Validasi apoteker diperlukan |
| 🖨️ | `printer` | Cetak struk |
| 📱 | `share` | Kirim WhatsApp |
| 📊 | `document-text` | Detail transaksi |
| 🆕 | `plus-circle` | Transaksi baru |
| ❌ | `x-circle` | Error, void |
| ⏳ | `arrow-path` (animate-spin) | Loading |
| 📅 | `calendar-days` | Date picker |

---

## 13. File Struktur (Rekomendasi Frontend)

```
src/
  pages/
    kasir/
      index.tsx                  # Halaman utama kasir
      components/
        TopBar.tsx               # Header bar
        ShiftDialog.tsx          # Buka/tutup shift dialog
        ProductSearch.tsx        # Search bar + barcode
        ProductGrid.tsx          # Grid produk
        ProductCard.tsx          # Card per produk
        CategoryFilter.tsx       # Filter pills
        CartSidebar.tsx          # Sidebar keranjang
        CartItem.tsx             # Item dalam keranjang
        ResepSlideover.tsx       # Panel tambah resep
        ValidasiDialog.tsx       # Dialog validasi apoteker
        PembayaranModal.tsx      # Modal pembayaran
        StrukSuccess.tsx         # Layar sukses + cetak
        CetakThermal.tsx         # Layout struk print
        KirimDigital.tsx         # Dialog kirim PDF/WA
      hooks/
        useCart.ts               # State keranjang (Zustand)
        useProducts.ts           # Fetch produk
        useShift.ts              # Shift state
        useCheckout.ts           # Checkout mutation
      utils/
        fefo.ts                  # Logic FEFO helper
        formatCurrency.ts        # Rp formatting
        generateStrukPdf.ts      # PDF generation
      types/
        index.ts                 # TypeScript types
```

---

## 14. Catatan Stack

Dokumen ini menggunakan Tailwind CSS + Heroicons sebagai referensi styling. Jika final stack berbeda (misal: shadcn/ui, Ant Design, MUI), sesuaikan kelas CSS dan komponen dengan library terkait, tapi pertahankan:
- Layout 2 kolom
- Warna yang sama
- Alur yang sama
- Rules aksesibilitas yang sama
