# Module PRD — Penjualan (Kasir)
### Bagian dari: Sistem POS & ERP Apotek
Versi: 1.0 | Status: Final (semua pertanyaan terbuka sudah terjawab)

---

## 1. Ringkasan & Scope

Modul ini adalah titik transaksi utama tempat kasir melayani pembelian obat. Scope versi pertama (MVP):

✅ **Termasuk:**
- Penjualan obat bebas (OTC — tanpa resep)
- Penjualan obat dengan resep **sederhana** (item langsung, bukan racikan campuran)
- Validasi wajib oleh Admin/Apoteker untuk obat golongan keras/narkotika sebelum bisa dibayar. **Apoteker selalu login sebagai Admin di meja kasirnya sendiri** — validasi cukup klik "Validasi & Lanjutkan". Kasir biasa TIDAK bisa transaksi obat keras; harus menggunakan akun Admin.
- 4 kategori metode pembayaran: Tunai, QRIS, Debit/Kredit, E-wallet (GoPay/OVO/DANA) — **semua dicatat manual**, tidak ada integrasi payment gateway. Kasir cukup pilih metode & konfirmasi "sudah diterima"
- **Satu metode pembayaran per transaksi** (tidak ada split payment untuk MVP)
- Cetak struk fisik (printer thermal) **dan** struk digital (PDF, bisa dikirim via WhatsApp)
- Pengurangan stok otomatis dengan prinsip FEFO (batch dengan expiry tercepat terjual duluan)

❌ **Belum termasuk (menyusul di modul terpisah nanti):**
- Racikan (campuran beberapa obat jadi satu resep) — racikan butuh modul Template Racikan & alur tuslah, sengaja dipisah biar modul ini nggak membengkak
- Retur penjualan (modul terpisah, walau struktur datanya nanti nyambung ke sini)
- Laporan & dashboard (sudah ada modul Home terpisah, modul ini cuma sumber datanya)
- **Fitur diskon** (tidak ada diskon untuk MVP — akan ditambahkan di versi berikutnya jika diperlukan)

---

## 2. Dependency yang Perlu Diketahui

Modul kasir ini **butuh fungsi shift kasir** (buka shift dengan modal awal, tutup shift dengan rekonsiliasi kas) supaya "Total Cash Kasir" di dashboard nyambung dan supaya tiap transaksi bisa dilacak ke shift siapa.

✅ **Keputusan final:** Bangun **versi minimal shift** di modul ini — buka shift → input modal awal → status aktif; tutup shift → input kas akhir. Kasir TIDAK BISA transaksi tanpa shift aktif.

Shift versi lengkap (riwayat shift, laporan selisih kas) dilengkapi nanti di modul Manajemen Pengguna.

---

## 3. Role & Hak Akses di Modul Ini

| Aksi | Kasir | Admin (Apoteker) | Owner |
|---|---|---|---|
| Buka/tutup shift | ✅ (shift miliknya) | ✅ | ✅ |
| Cari produk & buat transaksi baru | ✅ | ✅ | ✅ |
| Input data resep baru saat transaksi | ✅ | ✅ | ✅ |
| **Validasi/approve item golongan keras-narkotika** | ❌ (harus menggunakan akun Admin) | ✅ | ✅ |
| **Transaksi obat keras/narkotika** | ❌ | ✅ | ✅ |
| Batalkan transaksi sebelum dibayar | ✅ | ✅ | ✅ |
| Batalkan transaksi **setelah** dibayar (void) | ❌ | ✅ | ✅ |
| Lihat riwayat transaksi kasir lain | ❌ (hanya miliknya) | ✅ (semua outlet miliknya) | ✅ (semua outlet) |

Catatan penting: karena Admin = Apoteker, validasi obat keras/narkotika **wajib** lewat akun Admin — ini bukan cuma kontrol akses biasa, tapi merepresentasikan tanggung jawab hukum apoteker yang harus menyetujui pelepasan obat tersebut. Karena Admin selalu login di meja kasirnya sendiri, validasi dilakukan langsung dengan klik tombol "Validasi & Lanjutkan" — tanpa flow PIN atau approval dari perangkat terpisah.

---

## 4. Alur Pengguna (Frontend Flow)

### 4.1 Layar Utama Kasir
Layout 2 kolom:
- **Kolom kiri (lebar):** pencarian produk (search bar + scan barcode), grid/list hasil pencarian dengan foto/nama/harga/stok tersedia
- **Kolom kanan (sidebar tetap):** keranjang transaksi berjalan — daftar item, qty (bisa +/-), subtotal per item, total keseluruhan, tombol "Tambah dari Resep", tombol "Bayar"

### 4.2 Menambahkan Item Obat Bebas (OTC)
1. Kasir cari produk → klik/tap untuk menambah ke keranjang
2. Kalau produk yang dicari golongannya keras/narkotika dan TIDAK ada resep terkait di keranjang → produk tetap muncul di hasil pencarian tapi diberi badge merah "Wajib Resep", dan begitu diklik sistem mengarahkan ke alur 4.3, bukan langsung masuk keranjang

### 4.3 Menambahkan Item dari Resep
1. Kasir klik "Tambah dari Resep"
2. Sistem tanya: resep baru atau resep yang sudah pernah diinput (cari berdasarkan nama pasien/no resep, untuk kasus penebusan sebagian/lanjutan)
3. **Resep baru:** input nama pasien (atau pilih dari Kontak kalau sudah ada), pilih/input dokter, tanggal resep, lalu input daftar obat + jumlah yang diresepkan
4. Sistem otomatis menambahkan item tersebut ke keranjang dengan tag "Resep — [nama pasien]"
5. Kasir bisa pilih menebus penuh atau sebagian (qty kurang dari yang diresepkan); sisa yang belum ditebus otomatis tersimpan untuk ditebus lain waktu (status resep: belum/sebagian/lunas)

### 4.4 Validasi Apoteker (Gate sebelum bayar)
1. Begitu keranjang berisi minimal satu item golongan keras/narkotika/psikotropika, tombol "Bayar" berubah jadi nonaktif dengan label **"Menunggu Validasi Apoteker"**
2. **Jika yang login adalah Admin (Apoteker)/Owner:** cukup klik tombol "Validasi & Lanjutkan" → otomatis tercatat dirinya sebagai validator → transaksi bisa lanjut ke pembayaran
3. **Jika yang login adalah Kasir:** transaksi obat keras **tidak bisa dilanjutkan**. Kasir harus logout dan Admin/Owner yang login kembali untuk menyelesaikan transaksi tersebut. Tidak ada flow "Minta Validasi" atau bypass apapun.
4. Setiap validasi tercatat: siapa yang memvalidasi, jam berapa, transaksi yang mana (audit trail wajib untuk kepatuhan)

### 4.5 Pembayaran
1. Kasir klik "Bayar" → muncul ringkasan total
2. Pilih **satu** metode: Tunai / QRIS / Debit-Kredit / E-wallet (sub-pilihan: GoPay/OVO/DANA)
3. Kalau Tunai: input jumlah uang diterima → sistem hitung kembalian otomatis
4. Kalau metode lain (QRIS/Debit/E-wallet): tidak ada proses verifikasi otomatis — kasir cukup klik "Tandai Sudah Dibayar" (opsional: ada kolom catatan/nomor referensi manual kalau kasir mau catat)
5. Klik "Selesaikan Transaksi" → sistem:
   - Mengurangi stok per item (pilih batch dengan expiry tercepat / FEFO secara otomatis)
   - Menyimpan transaksi & item-itemnya
   - Update status resep terkait (kalau ada) jadi sebagian/lunas
   - Menampilkan opsi cetak: "Cetak Struk" (thermal) dan/atau "Kirim Digital" (PDF/WA)

### 4.6 Cetak Struk
- **Thermal:** memicu print dialog browser dengan layout struk ukuran 58mm/80mm (CSS khusus print)
- **Digital:** generate **PDF struk** (format PDF biasa, bukan link halaman web) + tombol "Kirim via WhatsApp" yang membuka WhatsApp dengan file PDF ter-attach atau link download ke nomor pelanggan (kalau nomor HP pelanggan ada di data)

---

## 5. Skema Data (Backend)

> Semua tabel otomatis punya kolom `tenant_id` untuk isolasi data antar apotek, dan dilindungi RLS sesuai role di Bagian 3.

### `shifts`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK ke tenant |
| outlet_id | uuid | FK ke outlets |
| kasir_id | uuid | FK ke users |
| modal_awal | numeric | input saat buka shift |
| kas_akhir | numeric, nullable | input saat tutup shift |
| status | enum | `aktif`, `ditutup` |
| dibuka_at | timestamp | |
| ditutup_at | timestamp, nullable | |

### `prescriptions` (Resep)
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | |
| pasien_id | uuid | FK ke contacts (pelanggan) |
| dokter_id | uuid, nullable | FK ke contacts (dokter) |
| tanggal_resep | date | |
| status | enum | `belum_ditebus`, `sebagian`, `lunas` |
| created_by | uuid | FK ke users (kasir yang input) |
| created_at | timestamp | |

### `prescription_items`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| prescription_id | uuid | FK |
| product_id | uuid | FK ke products |
| qty_diresepkan | integer | |
| qty_sudah_ditebus | integer, default 0 | |

### `sales_transactions`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | |
| outlet_id | uuid | |
| shift_id | uuid | FK |
| kasir_id | uuid | FK ke users (yang input transaksi) |
| prescription_id | uuid, nullable | FK, kalau transaksi terkait resep |
| pelanggan_id | uuid, nullable | FK ke contacts |
| subtotal | numeric | |
| total | numeric | |
| metode_bayar | enum | `tunai`, `qris`, `debit_kredit`, `gopay`, `ovo`, `dana` |
| jumlah_dibayar | numeric | |
| kembalian | numeric, default 0 | |
| catatan_bayar | text, nullable | referensi manual opsional |
| status | enum | `selesai`, `dibatalkan` |
| created_at | timestamp | |

> ⚠️ **Tidak ada kolom `diskon`** untuk MVP. Fitur diskon akan ditambahkan di versi berikutnya dengan struktur data tersendiri (termasuk batas persen approval).

### `sales_transaction_items`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| transaction_id | uuid | FK |
| product_id | uuid | FK |
| batch_id | uuid | FK ke product_batches (hasil pilihan FEFO otomatis) |
| qty | integer | |
| harga_satuan | numeric | |
| subtotal | numeric | |
| is_item_resep | boolean | |

### `prescription_validations`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| transaction_id | uuid | FK |
| validated_by | uuid | FK ke users (harus role Admin/Owner) |
| validated_at | timestamp | |

---

## 6. Business Rules Penting

1. **FEFO otomatis:** saat checkout, sistem cari batch produk yang sama dengan `expiry_date` paling dekat dan stok masih > 0, baru kurangi stok dari situ. Kalau batch itu habis di tengah qty yang diminta, lanjut ke batch berikutnya (split otomatis, transparan ke user).
2. **Stok harus atomic:** pengurangan stok dan pembuatan transaksi harus satu operasi yang tidak bisa "setengah jalan" — kalau gagal di tengah, semua dibatalkan (mencegah stok minus akibat dua kasir checkout produk sama di waktu bersamaan).
3. **Validasi resep wajib sebelum bayar** untuk item golongan keras/narkotika/psikotropika — tidak bisa dilewati dengan cara apa pun.
4. **Transaksi yang sudah `selesai` tidak bisa diedit langsung** — perubahan (misal salah input) harus lewat alur Void (Admin/Owner saja) yang otomatis mengembalikan stok, bukan edit manual ke transaksi lama. Ini supaya audit trail tetap utuh.
5. **Penebusan resep sebagian:** `qty_sudah_ditebus` di `prescription_items` bertambah tiap kali ada transaksi terkait; status resep otomatis jadi `lunas` kalau semua item sudah `qty_sudah_ditebus = qty_diresepkan`.
6. **Shift wajib aktif:** sistem menolak transaksi baru jika tidak ada shift dengan status `aktif` milik user yang login.
7. **Satu metode pembayaran per transaksi:** hanya satu `metode_bayar` per `sales_transactions`. Tidak ada split payment untuk MVP.
8. **Tidak ada diskon untuk MVP:** tidak ada kolom atau logika diskon di versi ini. Akan ditambahkan di modul/fase berikutnya.

---

## 7. Semua Pertanyaan Terbuka — SUDAH TERJAWAB ✅

| # | Pertanyaan | Jawaban Final |
|---|---|---|
| 1 | Shift kasir: versi minimal atau "selalu aktif"? | Versi minimal — buka/tutup shift + modal awal/kas akhir |
| 2 | Validasi Admin via PIN di perangkat sama atau mekanisme lain? | Admin selalu login di meja kasirnya sendiri → validasi cukup klik "Validasi & Lanjutkan". Kasir tidak bisa transaksi obat keras (harus pakai akun Admin) |
| 3 | Struk digital: PDF atau link halaman web? | PDF biasa |
| 4 | Batas diskon kasir tanpa approval? | Tidak ada fitur diskon untuk MVP |
| 5 | Split payment (multi-metode bayar per transaksi)? | Satu metode per transaksi |

---

## 8. AI Build Prompt (Siap Pakai)

> Prompt ini bisa langsung dipakai di Claude Code atau tools AI coding lain untuk mulai membangun modul ini. Sesuaikan placeholder `[STACK]` dengan tech stack final kamu.

```
Saya sedang membangun modul "Penjualan (Kasir)" untuk aplikasi POS apotek berbasis web,
multi-tenant SaaS, menggunakan [STACK].

KONTEKS SISTEM:
- Multi-tenant: setiap baris data terikat ke tenant_id, isolasi data wajib lewat Row Level
  Security (RLS) di database.
- 3 role pengguna: owner, admin (apoteker), kasir — dengan hak akses berbeda (lihat detail
  di bawah).
- Database: PostgreSQL (Supabase).

KEPUTUSAN FINAL UNTUK MVP:
- Shift kasir versi minimal (buka/tutup + modal awal/kas akhir). Tidak bisa transaksi tanpa shift aktif.
- Validasi obat keras: Admin login sendiri di meja kasir → cukup klik "Validasi & Lanjutkan". Kasir biasa tidak bisa transaksi obat keras sama sekali (harus pakai akun Admin).
- Struk digital: PDF biasa (bukan link halaman web).
- TIDAK ADA fitur diskon untuk MVP.
- TIDAK ADA split payment. Satu metode bayar per transaksi.

TUGAS:
Bangun modul kasir dengan scope berikut:

1. SKEMA DATABASE
   Buatkan migration SQL untuk tabel: shifts, prescriptions, prescription_items,
   sales_transactions, sales_transaction_items, prescription_validations.
   (gunakan skema kolom persis seperti pada dokumen PRD terlampir, Bagian 5)
   Catatan: TIDAK ADA kolom diskon di sales_transactions.
   Sertakan RLS policy per tabel:
   - kasir hanya bisa INSERT/SELECT data miliknya sendiri & outletnya
   - admin/owner bisa SELECT semua data dalam tenant yang sama
   - tidak ada role yang bisa hard-delete sales_transactions (gunakan status, bukan delete)

2. BACKEND LOGIC
   - Fungsi checkout yang atomic: kurangi stok berbasis FEFO (batch expiry tercepat dulu),
     buat sales_transaction + items, update prescription_items.qty_sudah_ditebus jika
     transaksi terkait resep, semua dalam satu transaction database (rollback jika gagal).
   - Validasi: tolak checkout jika ada item golongan keras/narkotika tanpa
     prescription_validations terkait.
   - Validasi: tolak transaksi jika tidak ada shift aktif untuk user tersebut.
   - Endpoint/RPC untuk: cari produk (by nama/barcode), buat resep baru, validasi resep
     oleh admin, proses checkout, generate PDF struk.

3. FRONTEND
   - Halaman kasir 2 kolom: search produk (kiri) + keranjang transaksi (kanan), responsif
     untuk tablet & desktop.
   - Alur "Tambah dari Resep" sesuai Bagian 4.3 PRD (resep baru / resep existing untuk
     penebusan sebagian).
   - Gate validasi: jika ada item keras/narkotika → tombol Bayar nonaktif, Admin klik
     "Validasi & Lanjutkan". Jika login sebagai Kasir → tidak bisa lanjutkan transaksi.
     Tidak ada flow PIN atau approval jarak jauh.
   - Form pembayaran dengan pilihan SATU metode (tunai/qris/debit-kredit/e-wallet),
     kalkulasi kembalian otomatis untuk tunai.
   - Setelah checkout sukses: tampilkan opsi cetak thermal (window.print dengan CSS struk
     58mm) dan generate struk digital (PDF) + tombol share WhatsApp.

Mohon mulai dari skema database dan RLS policy dulu sebelum lanjut ke frontend.
```

---

## 9. Langkah Berikutnya

Modul ini sudah **final** — semua pertanyaan terbuka sudah terjawab dan dokumen sudah siap untuk development.

Rekomendasi modul berikutnya:
- **Master Data** (produk, kategori, satuan, supplier, golongan obat) — karena modul Kasir bergantung ke struktur data produk yang belum detail
- **Persediaan** (stok, FEFO, stock opname, product_batches detail) — kalau kamu mau fitur stok didetailkan lebih dulu
