# Module PRD — Home / Dashboard
### Bagian dari: Sistem POS & ERP Apotek
Versi: 1.0 | Status: Final

---

## 1. Ringkasan

Dashboard adalah layar pertama setelah login — memberikan ringkasan bisnis dan menjadi hub navigasi ke seluruh modul. Modul ini tidak punya tabel database sendiri, melainkan query aggregat dari modul lain.

---

## 2. Konten Dashboard (MVP)

### KPI Cards
| Metrik | Sumber Data |
|--------|-------------|
| Total Penjualan Hari Ini | `sales_transactions` (status=selesai, today) |
| Total Keuntungan Hari Ini | SUM(`harga_jual` - `harga_beli`) dari item terjual |
| Total Cash Kasir Aktif | `shifts` (status=aktif) |
| Jumlah Transaksi Hari Ini | COUNT(`sales_transactions`) today |
| Stok Menipis (≤ minimum) | Defecta query dari Persediaan |
| Batch Hampir Kadaluarsa (<90 hari) | `product_batches` query |
| Hutang Supplier Jatuh Tempo | `purchase_invoices` query |

### Grafik
- Penjualan 7 hari terakhir (bar chart)
- Top 5 produk terlaris minggu ini

### Quick Actions
- [Ke Kasir] → buka halaman Kasir
- [Input Resep Baru] → buka form resep
- [Lihat Defecta] → buka defecta
- [Buat PO] → buka form PO

### Sidebar Navigasi (muncul di setiap modul)

```
┌─────────────────────┐
│ 💊 [Nama Apotek]    │  ← dari tenant_profiles
│─────────────────────│
│ 🏠 Home / Dashboard │
│ 💰 Kasir             │
│ 📦 Master Data       │
│ 📊 Persediaan        │
│ 📋 Pembelian         │
│ 👥 Kontak            │
│ 📋 Pelayanan         │
│ ⚙️ Settings          │
│─────────────────────│
│ [Nama User]          │
│ [Logout]             │
└─────────────────────┘
```

---

## 3. Navigasi Global

Sidebar tetap muncul di SEMUA modul. Data nama apotek diambil dari `tenant_profiles` (lihat Module Settings). Role menentukan menu mana saja yang terlihat:

| Menu | Kasir | Admin | Owner |
|------|-------|-------|-------|
| Home | ✅ | ✅ | ✅ |
| Kasir | ✅ | ✅ | ✅ |
| Master Data | ❌ | ✅ | ✅ |
| Persediaan | ❌ | ✅ | ✅ |
| Pembelian | ❌ | ✅ | ✅ |
| Kontak | ✅ (view) | ✅ | ✅ |
| Pelayanan | ✅ | ✅ | ✅ |
| Settings | ❌ | ✅ | ✅ |
| Laporan | ❌ | ✅ | ✅ |
| Manajemen Pengguna | ❌ | ❌ | ✅ |

---

## 4. Build Prompt

```
Bangun modul Home/Dashboard untuk aplikasi apotek:
- Query aggregat dari sales_transactions, product_batches, purchase_invoices
- KPI cards responsif
- Grafik penjualan 7 hari + top 5 produk
- Sidebar navigasi global yang dipakai di semua modul (pakai layout terpisah)
- Nama apotek dari tabel tenant_profiles
- Role-based menu visibility
```
