# Progress Perbaikan Kasir

- Status: audit dimulai

- Audit menemukan kasir tidak memuat bridge, memiliki processPayment rusak, dan onclick produk gagal untuk ID string.
- Master data masih statis; dipatch agar menyimpan source produk ke localStorage `apotek_products_master`.
- Kasir dipatch untuk membaca source yang sama + fallback aman.

- Checkout kasir dipatch agar menyimpan transaksi ke local history + mencoba bridge ApotekDB.saveTransaction.
- Setelah checkout, stok produk source master (`apotek_products_master`) sekarang dikurangi berdasarkan item terjual.
