-- ==============================================================================
-- ApotekPOS — Seed Data (Demo) — Fixed v3
-- Run AFTER migration.sql
-- ==============================================================================

-- 1. OUTLET
insert into outlets (id, tenant_id, nama, alamat, telepon) values
  ('a1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'Outlet Pusat', 'Jl. Kesehatan No. 42, Jakarta Pusat', '(021) 555-0192');

-- 2. TENANT PROFILE
insert into tenant_profiles (tenant_id, nama_apotek, alamat, kota, telepon, footer_struk, default_outlet_id)
  values ('00000000-0000-0000-0000-000000000000', 'Apotek Sehat', 'Jl. Kesehatan No. 42, Jakarta Pusat', 'Jakarta', '(021) 555-0192', 'Terima Kasih', 'a1111111-1111-1111-1111-111111111111')
  on conflict (tenant_id) do nothing;

-- 3. USERS
insert into user_profiles (id, tenant_id, role, nama_lengkap, outlet_id) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '00000000-0000-0000-0000-000000000000', 'owner', 'Owner Apotek', 'a1111111-1111-1111-1111-111111111111');
insert into user_profiles (id, tenant_id, role, nama_lengkap, outlet_id) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '00000000-0000-0000-0000-000000000000', 'admin', 'Dr. Andi Pratama, S.Farm., Apt.', 'a1111111-1111-1111-1111-111111111111');
insert into user_profiles (id, tenant_id, role, nama_lengkap, outlet_id) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '00000000-0000-0000-0000-000000000000', 'kasir', 'Budi Kasir', 'a1111111-1111-1111-1111-111111111111');

-- 4. UNITS
insert into units (id, tenant_id, nama, singkatan) values ('b0000001-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'Tablet', 'tab');
insert into units (id, tenant_id, nama, singkatan) values ('b0000002-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'Strip', 'str');
insert into units (id, tenant_id, nama, singkatan) values ('b0000003-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'Box', 'box');
insert into units (id, tenant_id, nama, singkatan) values ('b0000004-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'Botol', 'btl');
insert into units (id, tenant_id, nama, singkatan) values ('b0000005-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'Kapsul', 'kaps');
insert into units (id, tenant_id, nama, singkatan) values ('b0000006-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'Pcs', 'pcs');

-- 5. CATEGORIES
insert into product_categories (id, tenant_id, nama, urutan) values ('c0000001-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'Obat Bebas', 1);
insert into product_categories (id, tenant_id, nama, urutan) values ('c0000002-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'Obat Keras', 2);
insert into product_categories (id, tenant_id, nama, urutan) values ('c0000003-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'Vitamin & Suplemen', 3);
insert into product_categories (id, tenant_id, nama, urutan) values ('c0000004-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'Alat Kesehatan', 4);

-- 6. PRODUCTS
insert into products (id, tenant_id, kode_produk, nama_dagang, nama_generik, kategori_id, satuan_dasar_id, golongan, harga_beli, harga_jual, stok_minimum, produsen) values
  ('d0000001-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'PROD-000001', 'Paracetamol 500mg', 'Paracetamol', 'c0000001-1111-1111-1111-111111111111', 'b0000002-1111-1111-1111-111111111111', 'bebas', 3500, 5000, 10, 'Kimia Farma');
insert into products (id, tenant_id, kode_produk, nama_dagang, nama_generik, kategori_id, satuan_dasar_id, golongan, harga_beli, harga_jual, stok_minimum, produsen) values
  ('d0000002-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'PROD-000002', 'Amoxicillin 500mg', 'Amoxicillin', 'c0000002-1111-1111-1111-111111111111', 'b0000005-1111-1111-1111-111111111111', 'keras', 8000, 12000, 5, 'Dexa Medica');
insert into products (id, tenant_id, kode_produk, nama_dagang, nama_generik, kategori_id, satuan_dasar_id, golongan, harga_beli, harga_jual, stok_minimum, produsen) values
  ('d0000003-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'PROD-000003', 'Vitamin C 500mg', 'Ascorbic Acid', 'c0000003-1111-1111-1111-111111111111', 'b0000001-1111-1111-1111-111111111111', 'vitamin', 5500, 8000, 8, 'Kalbe Farma');
insert into products (id, tenant_id, kode_produk, nama_dagang, nama_generik, kategori_id, satuan_dasar_id, golongan, harga_beli, harga_jual, stok_minimum, produsen) values
  ('d0000004-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'PROD-000004', 'Cetirizine 10mg', 'Cetirizine', 'c0000002-1111-1111-1111-111111111111', 'b0000001-1111-1111-1111-111111111111', 'keras', 4500, 7000, 6, 'Sanbe Farma');
insert into products (id, tenant_id, kode_produk, nama_dagang, nama_generik, kategori_id, satuan_dasar_id, golongan, harga_beli, harga_jual, stok_minimum, produsen, is_konsinyasi) values
  ('d0000005-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'PROD-000005', 'OBH Combi 100ml', 'OBH', 'c0000001-1111-1111-1111-111111111111', 'b0000004-1111-1111-1111-111111111111', 'bebas_terbatas', 10000, 15000, 5, 'Combiphar', false);
insert into products (id, tenant_id, kode_produk, nama_dagang, nama_generik, kategori_id, satuan_dasar_id, golongan, harga_beli, harga_jual, stok_minimum, produsen, is_konsinyasi) values
  ('d0000006-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'PROD-000006', 'Betadine Sol. 60ml', 'Povidone Iodine', 'c0000004-1111-1111-1111-111111111111', 'b0000004-1111-1111-1111-111111111111', 'bebas', 18000, 25000, 3, 'Mediasept', true);

-- 7. PRODUCT UNITS
insert into product_units (id, tenant_id, product_id, unit_id, konversi_ke_dasar, is_satuan_dasar, is_satuan_jual_default) values
  ('e0000001-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'd0000001-1111-1111-1111-111111111111', 'b0000002-1111-1111-1111-111111111111', 1, true, true);
insert into product_units (id, tenant_id, product_id, unit_id, konversi_ke_dasar, is_satuan_dasar, is_satuan_jual_default) values
  ('e0000002-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'd0000001-1111-1111-1111-111111111111', 'b0000001-1111-1111-1111-111111111111', 10, false, false);

-- 8. SUPPLIERS
insert into suppliers (id, tenant_id, kode, nama, tipe, alamat, kota, telepon) values
  ('f0000001-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'SUP-001', 'PT. Kimia Farma Trading', 'pbf', 'Jl. Veteran No. 9', 'Jakarta', '(021) 345-6789');
insert into suppliers (id, tenant_id, kode, nama, tipe, alamat, kota, telepon) values
  ('f0000002-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'SUP-002', 'PT. Bina San Prima', 'pbf', 'Jl. Industri No. 15', 'Bandung', '(022) 456-7890');
insert into suppliers (id, tenant_id, kode, nama, tipe, alamat, kota, telepon) values
  ('f0000003-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'SUP-003', 'Toko Obat Murah', 'supplier_umum', 'Jl. Pasar Baru No. 3', 'Jakarta', '(021) 567-8901');

-- 9. PRODUCT SUPPLIERS
insert into product_suppliers (id, tenant_id, product_id, supplier_id, lead_time_hari, is_supplier_utama) values
  ('af000001-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'd0000001-1111-1111-1111-111111111111', 'f0000001-1111-1111-1111-111111111111', 3, true);

-- 10. CONTACTS
insert into contacts (id, tenant_id, tipe, kode, nama, no_hp, alamat, member_status) values
  ('aa000001-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'pelanggan', 'PEL-000001', 'Budi Santoso', '081234567890', 'Jl. Melati No. 5', 'member');
insert into contacts (id, tenant_id, tipe, kode, nama, no_hp, alamat) values
  ('aa000002-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'pelanggan', 'PEL-000002', 'Siti Aminah', '087654321098', 'Jl. Mawar No. 12');

-- 11. PRODUCT BATCHES
insert into product_batches (id, tenant_id, product_id, outlet_id, nomor_batch, tanggal_kadaluarsa, stok, stok_awal) values
  ('ab000001-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'd0000001-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'BN-2026-018', '2026-12-31', 25, 25);
insert into product_batches (id, tenant_id, product_id, outlet_id, nomor_batch, tanggal_kadaluarsa, stok, stok_awal) values
  ('ab000002-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'd0000002-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'BN-2026-022', '2026-10-15', 15, 15);
insert into product_batches (id, tenant_id, product_id, outlet_id, nomor_batch, tanggal_kadaluarsa, stok, stok_awal) values
  ('ab000003-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'd0000001-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'BN-2026-030', '2027-03-20', 100, 100);

-- 12. SHIFT
insert into shifts (id, tenant_id, outlet_id, kasir_id, modal_awal, status) values
  ('ac000001-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'a1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 500000, 'aktif');

-- 13. SALES TRANSACTION (demo)
insert into sales_transactions (id, tenant_id, outlet_id, shift_id, kasir_id, pelanggan_id, subtotal, total, metode_bayar, jumlah_dibayar, kembalian, status) values
  ('ad000001-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'a1111111-1111-1111-1111-111111111111', 'ac000001-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'aa000001-1111-1111-1111-111111111111', 15000, 15000, 'tunai', 20000, 5000, 'selesai');
insert into sales_transaction_items (id, tenant_id, transaction_id, product_id, batch_id, qty, harga_satuan, subtotal, is_item_resep) values
  ('ae000001-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'ad000001-1111-1111-1111-111111111111', 'd0000001-1111-1111-1111-111111111111', 'ab000001-1111-1111-1111-111111111111', 3, 5000, 15000, false);

-- 14. WA TEMPLATES
insert into wa_templates (tenant_id, nama, kategori, pesan) values
  ('00000000-0000-0000-0000-000000000000', 'Follow-up Resep', 'Follow-up', 'Halo, jangan lupa tebus resep Anda di Apotek Sehat.');
insert into wa_templates (tenant_id, nama, kategori, pesan) values
  ('00000000-0000-0000-0000-000000000000', 'Invoice Penjualan', 'Invoice', 'Terima kasih telah berbelanja. Berikut invoice Anda.');

-- 15. PROMOS
insert into promos (tenant_id, nama, tipe, nilai, produk_id, mulai, selesai, deskripsi, status) values
  ('00000000-0000-0000-0000-000000000000', 'Diskon Vitamin', 'persen', 10, 'd0000003-1111-1111-1111-111111111111', current_date, current_date + interval '14 days', 'Promo vitamin', 'active');

-- 16. PURCHASE ORDER
insert into purchase_orders (id, tenant_id, outlet_id, nomor_po, supplier_id, tanggal_po, status, created_by) values
  ('ba000001-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'a1111111-1111-1111-1111-111111111111', 'PO-2026-0001', 'f0000001-1111-1111-1111-111111111111', current_date - interval '10 days', 'sebagian', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2');
insert into purchase_order_items (id, tenant_id, po_id, product_id, product_unit_id, qty_dipesan, qty_diterima, harga_beli_estimasi) values
  ('bb000001-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'ba000001-1111-1111-1111-111111111111', 'd0000001-1111-1111-1111-111111111111', 'e0000001-1111-1111-1111-111111111111', 5, 3, 352000);

-- 17. PURCHASE INVOICE
insert into purchase_invoices (id, tenant_id, outlet_id, nomor_faktur, supplier_id, nomor_faktur_supplier, tanggal_faktur, tanggal_jatuh_tempo, total, jumlah_dibayar, status, created_by) values
  ('bc000001-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'a1111111-1111-1111-1111-111111111111', 'FK-2026-0001', 'f0000001-1111-1111-1111-111111111111', 'INV-KF-0001', current_date - interval '7 days', current_date + interval '23 days', 1500000, 500000, 'diterima', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2');
insert into purchase_invoice_items (id, tenant_id, faktur_id, product_id, product_unit_id, qty, harga_beli, nomor_batch, tanggal_kadaluarsa) values
  ('bd000001-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'bc000001-1111-1111-1111-111111111111', 'd0000001-1111-1111-1111-111111111111', 'e0000001-1111-1111-1111-111111111111', 3, 352000, 'BN-2026-040', current_date + interval '720 days');

-- 18. STOCK MUTATIONS
insert into stock_mutations (tenant_id, product_id, batch_id, tipe, qty, qty_dasar, stok_sebelum, stok_sesudah, referensi_id, referensi_tipe, created_by) values
  ('00000000-0000-0000-0000-000000000000', 'd0000001-1111-1111-1111-111111111111', 'ab000001-1111-1111-1111-111111111111', 'masuk', 3, 300, 25, 28, 'bc000001-1111-1111-1111-111111111111', 'pembelian', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2');

-- 19. JOURNAL ENTRIES
insert into journal_entries (tenant_id, outlet_id, entry_date, source_type, source_id, debit, credit, description, created_by) values
  ('00000000-0000-0000-0000-000000000000', 'a1111111-1111-1111-1111-111111111111', current_date, 'penjualan', 'ad000001-1111-1111-1111-111111111111', 15000, 0, 'Kas dari penjualan', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2');
insert into journal_entries (tenant_id, outlet_id, entry_date, source_type, source_id, debit, credit, description, created_by) values
  ('00000000-0000-0000-0000-000000000000', 'a1111111-1111-1111-1111-111111111111', current_date, 'penjualan', 'ad000001-1111-1111-1111-111111111111', 0, 15000, 'Pendapatan penjualan', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2');
insert into journal_entries (tenant_id, outlet_id, entry_date, source_type, source_id, debit, credit, description, created_by) values
  ('00000000-0000-0000-0000-000000000000', 'a1111111-1111-1111-1111-111111111111', current_date, 'pembelian', 'bc000001-1111-1111-1111-111111111111', 1500000, 0, 'Faktur pembelian', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2');

-- 20. CONSIGNMENT
insert into consignment_entries (tenant_id, outlet_id, product_id, supplier_id, transaction_item_id, source_type, source_id, qty, amount, status, catatan) values
  ('00000000-0000-0000-0000-000000000000', 'a1111111-1111-1111-1111-111111111111', 'd0000006-1111-1111-1111-111111111111', 'f0000001-1111-1111-1111-111111111111', 'ae000001-1111-1111-1111-111111111111', 'penjualan', 'ad000001-1111-1111-1111-111111111111', 2, 50000, 'pending', 'Konsinyasi demo');

-- DONE