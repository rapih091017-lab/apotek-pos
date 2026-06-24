-- ==============================================================================
-- ApotekPOS — Complete Database Migration
-- PostgreSQL (Supabase) · Multi-tenant SaaS
-- Generated from Module PRDs 00-06
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. ENUMS
create type user_role as enum ('owner', 'admin', 'kasir');
create type golongan_obat as enum ('bebas', 'bebas_terbatas', 'keras', 'narkotika', 'psikotropika', 'prekursor', 'vitamin');
create type supplier_tipe as enum ('pbf', 'supplier_umum');
create type barcode_tipe as enum ('pabrik', 'internal');
create type contact_tipe as enum ('pelanggan', 'dokter');
create type member_status as enum ('biasa', 'member');
create type jenis_kelamin as enum ('pria', 'wanita');
create type shift_status as enum ('aktif', 'ditutup');
create type resep_status as enum ('belum_ditebus', 'sebagian', 'lunas');
create type transaksi_status as enum ('selesai', 'dibatalkan');
create type metode_bayar as enum ('tunai', 'qris', 'debit_kredit', 'gopay', 'ovo', 'dana');
create type po_status as enum ('draft', 'dikirim', 'sebagian', 'lunas');
create type faktur_status as enum ('draft', 'diterima', 'lunas');
create type retur_alasan as enum ('rusak', 'salah_kirim', 'kadaluarsa', 'lainnya');
create type opname_status as enum ('draft', 'menunggu_approval', 'disetujui', 'ditolak');
create type mutasi_tipe as enum ('masuk', 'keluar', 'adjustment', 'opname_masuk', 'opname_keluar', 'retur_masuk', 'retur_keluar');

-- 3. HELPERS
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function get_tenant_id()
returns uuid as $$
declare
  claims json;
  tenant_text text;
begin
  claims := coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::json;
  tenant_text := claims->>'tenant_id';

  if tenant_text is null or tenant_text = '' then
    return '00000000-0000-0000-0000-000000000000'::uuid;
  end if;

  return tenant_text::uuid;
end;
$$ language plpgsql stable;

-- ==============================================================================
-- MODULE 00: TENANT PROFILES & OUTLETS
-- ==============================================================================
create table tenant_profiles (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null unique,
  nama_apotek varchar(200) not null default 'Apotek Baru',
  alamat text,
  kota varchar(100),
  telepon varchar(30),
  email varchar(100),
  logo_url text,
  footer_struk text default 'Terima Kasih — Obat yang sudah dibeli tidak dapat ditukar',
  default_outlet_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_tenant_profiles_updated before update on tenant_profiles
  for each row execute function update_updated_at();

create table outlets (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null,
  nama varchar(100) not null,
  alamat text,
  telepon varchar(30),
  is_aktif boolean not null default true,
  created_at timestamptz not null default now()
);
create index idx_outlets_tenant on outlets(tenant_id);

-- ==============================================================================
-- MODULE LOGIN: USERS (maps to Supabase auth.users)
-- ==============================================================================
create table user_profiles (
  id uuid primary key,
  tenant_id uuid not null,
  role user_role not null default 'kasir',
  nama_lengkap varchar(200) not null,
  email varchar(100),
  outlet_id uuid references outlets(id),
  is_aktif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_user_profiles_tenant on user_profiles(tenant_id);
create trigger trg_user_profiles_updated before update on user_profiles
  for each row execute function update_updated_at();

-- ==============================================================================
-- MODULE 02: MASTER DATA
-- ==============================================================================
create table drug_classifications (
  id int primary key generated always as identity,
  kode varchar(30) not null unique,
  nama varchar(50) not null,
  warna_badge varchar(7) not null,
  deskripsi text
);

create table units (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null,
  nama varchar(50) not null,
  singkatan varchar(20),
  deskripsi text,
  created_at timestamptz not null default now()
);
create index idx_units_tenant on units(tenant_id);

create table product_categories (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null,
  nama varchar(100) not null,
  parent_id uuid references product_categories(id),
  deskripsi text,
  urutan int not null default 0,
  created_at timestamptz not null default now()
);
create index idx_categories_tenant on product_categories(tenant_id);

create table products (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null,
  kode_produk varchar(50) not null,
  nama_dagang varchar(200) not null,
  nama_generik varchar(200),
  kategori_id uuid references product_categories(id),
  satuan_dasar_id uuid references units(id),
  golongan golongan_obat not null default 'bebas',
  is_konsinyasi boolean not null default false,
  harga_beli numeric(12,2) default 0,
  harga_jual numeric(12,2) not null default 0,
  het numeric(12,2),
  produsen varchar(200),
  deskripsi text,
  gambar_url text,
  margin_persen numeric(5,2),
  stok_minimum int not null default 0,
  stok_maksimum int not null default 0,
  rata_rata_penjualan_harian numeric(8,2),
  is_aktif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index idx_products_kode on products(tenant_id, kode_produk);
create index idx_products_nama on products(tenant_id, nama_dagang);
create index idx_products_golongan on products(tenant_id, golongan);
create index idx_products_kategori on products(tenant_id, kategori_id);
create trigger trg_products_updated before update on products
  for each row execute function update_updated_at();

create table product_units (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null,
  product_id uuid not null references products(id),
  unit_id uuid not null references units(id),
  konversi_ke_dasar numeric not null default 1,
  is_satuan_dasar boolean not null default false,
  is_satuan_jual_default boolean not null default false,
  barcode varchar(100),
  created_at timestamptz not null default now()
);
create index idx_product_units_product on product_units(tenant_id, product_id);

create table product_barcodes (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null,
  product_id uuid not null references products(id),
  barcode varchar(100) not null,
  tipe barcode_tipe not null default 'pabrik',
  product_unit_id uuid references product_units(id),
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index idx_barcodes_code on product_barcodes(tenant_id, barcode);

create table suppliers (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null,
  kode varchar(50) not null,
  nama varchar(200) not null,
  tipe supplier_tipe not null default 'supplier_umum',
  no_izin_pbf varchar(100),
  alamat text,
  kota varchar(100),
  telepon varchar(30),
  email varchar(100),
  contact_person varchar(100),
  is_aktif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index idx_suppliers_kode on suppliers(tenant_id, kode);
create trigger trg_suppliers_updated before update on suppliers
  for each row execute function update_updated_at();

create table product_suppliers (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null,
  product_id uuid not null references products(id),
  supplier_id uuid not null references suppliers(id),
  lead_time_hari int,
  is_supplier_utama boolean not null default false,
  catatan text,
  created_at timestamptz not null default now()
);
create unique index idx_product_suppliers on product_suppliers(tenant_id, product_id, supplier_id);

-- ==============================================================================
-- MODULE 05: KONTAK (CUSTOMERS & DOCTORS)
-- ==============================================================================
create table contacts (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null,
  tipe contact_tipe not null,
  kode varchar(50) not null,
  nama varchar(200) not null,
  no_hp varchar(30),
  email varchar(100),
  alamat text,
  tanggal_lahir date,
  jenis_kelamin jenis_kelamin,
  no_sip varchar(50),
  spesialisasi varchar(100),
  institusi varchar(200),
  member_status member_status default 'biasa',
  poin int not null default 0,
  tanggal_bergabung date,
  catatan text,
  is_aktif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index idx_contacts_kode on contacts(tenant_id, kode);
create index idx_contacts_tipe on contacts(tenant_id, tipe);
create index idx_contacts_nama on contacts(tenant_id, nama);
create index idx_contacts_nohp on contacts(tenant_id, no_hp);
create trigger trg_contacts_updated before update on contacts
  for each row execute function update_updated_at();

-- ==============================================================================
-- MODULE 01: KASIR (SALES)
-- ==============================================================================
create table shifts (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null,
  outlet_id uuid not null references outlets(id),
  kasir_id uuid not null references user_profiles(id),
  modal_awal numeric(12,2) not null default 0,
  kas_akhir numeric(12,2),
  status shift_status not null default 'aktif',
  dibuka_at timestamptz not null default now(),
  ditutup_at timestamptz
);
create index idx_shifts_active on shifts(tenant_id, kasir_id, status);

create table prescriptions (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null,
  pasien_id uuid not null references contacts(id),
  dokter_id uuid references contacts(id),
  tanggal_resep date not null,
  status resep_status not null default 'belum_ditebus',
  created_by uuid not null references user_profiles(id),
  created_at timestamptz not null default now()
);

create table prescription_items (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null,
  prescription_id uuid not null references prescriptions(id),
  product_id uuid not null references products(id),
  qty_diresepkan int not null,
  qty_sudah_ditebus int not null default 0
);
create index idx_prescription_items_tenant on prescription_items(tenant_id, prescription_id);

create table sales_transactions (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null,
  outlet_id uuid not null references outlets(id),
  shift_id uuid not null references shifts(id),
  kasir_id uuid not null references user_profiles(id),
  prescription_id uuid references prescriptions(id),
  pelanggan_id uuid references contacts(id),
  subtotal numeric(12,2) not null,
  total numeric(12,2) not null,
  metode_bayar metode_bayar not null,
  jumlah_dibayar numeric(12,2) not null,
  kembalian numeric(12,2) not null default 0,
  catatan_bayar text,
  status transaksi_status not null default 'selesai',
  created_at timestamptz not null default now()
);
create index idx_sales_tenant on sales_transactions(tenant_id, created_at desc);
create index idx_sales_kasir on sales_transactions(tenant_id, kasir_id, created_at desc);
create index idx_sales_shift on sales_transactions(shift_id);

create table sales_transaction_items (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null,
  transaction_id uuid not null references sales_transactions(id),
  product_id uuid not null references products(id),
  batch_id uuid not null,
  qty int not null,
  harga_satuan numeric(12,2) not null,
  subtotal numeric(12,2) not null,
  is_item_resep boolean not null default false
);
create index idx_sales_items_txn on sales_transaction_items(tenant_id, transaction_id);
create index idx_sales_items_product on sales_transaction_items(tenant_id, product_id);
create index idx_sales_items_batch on sales_transaction_items(tenant_id, batch_id);
create index idx_sales_items_resep on sales_transaction_items(tenant_id, is_item_resep);
create index idx_sales_items_txn_only on sales_transaction_items(transaction_id);

create table prescription_validations (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null,
  transaction_id uuid not null references sales_transactions(id),
  validated_by uuid not null references user_profiles(id),
  validated_at timestamptz not null default now()
);
create index idx_prescription_validations_tenant on prescription_validations(tenant_id, transaction_id);

-- ==============================================================================
-- MODULE 03: PERSEDIAAN (INVENTORY)
-- ==============================================================================
create table product_batches (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null,
  product_id uuid not null references products(id),
  outlet_id uuid not null references outlets(id),
  nomor_batch varchar(100) not null,
  tanggal_kadaluarsa date not null,
  stok numeric(12,2) not null default 0,
  stok_awal numeric(12,2) not null default 0,
  faktur_pembelian_id uuid,
  catatan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_batches_fefo on product_batches(tenant_id, product_id, stok, tanggal_kadaluarsa)
  where stok > 0;
create index idx_batches_expiry on product_batches(tenant_id, tanggal_kadaluarsa);
create unique index idx_batches_unique on product_batches(tenant_id, product_id, nomor_batch, outlet_id);
create trigger trg_batches_updated before update on product_batches
  for each row execute function update_updated_at();

alter table sales_transaction_items
  add constraint fk_sales_items_batch foreign key (batch_id) references product_batches(id);

create table stock_mutations (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null,
  product_id uuid not null references products(id),
  batch_id uuid not null references product_batches(id),
  product_unit_id uuid references product_units(id),
  tipe mutasi_tipe not null,
  qty numeric(12,2) not null,
  qty_dasar numeric(12,2) not null,
  stok_sebelum numeric(12,2) not null,
  stok_sesudah numeric(12,2) not null,
  referensi_id uuid,
  referensi_tipe varchar(50),
  catatan text,
  created_by uuid references user_profiles(id),
  created_at timestamptz not null default now()
);
create index idx_mutations_product on stock_mutations(tenant_id, product_id, created_at desc);
create index idx_mutations_batch on stock_mutations(tenant_id, batch_id, created_at desc);
create index idx_mutations_tipe on stock_mutations(tenant_id, tipe);

create table stock_opname (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null,
  outlet_id uuid not null references outlets(id),
  status opname_status not null default 'draft',
  catatan text,
  created_by uuid not null references user_profiles(id),
  approved_by uuid references user_profiles(id),
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create table stock_opname_items (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null,
  opname_id uuid not null references stock_opname(id),
  product_id uuid not null references products(id),
  batch_id uuid references product_batches(id),
  stok_sistem numeric(12,2) not null,
  stok_fisik numeric(12,2),
  selisih numeric(12,2) generated always as (coalesce(stok_fisik, stok_sistem) - stok_sistem) stored,
  catatan text
);
create index idx_opname_items on stock_opname_items(opname_id);

-- ==============================================================================
-- MODULE 04: PEMBELIAN (PURCHASING)
-- ==============================================================================
create table purchase_orders (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null,
  outlet_id uuid not null references outlets(id),
  nomor_po varchar(50) not null,
  supplier_id uuid not null references suppliers(id),
  tanggal_po date not null default current_date,
  status po_status not null default 'draft',
  catatan text,
  created_by uuid references user_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index idx_po_nomor on purchase_orders(tenant_id, nomor_po);
create trigger trg_po_updated before update on purchase_orders
  for each row execute function update_updated_at();

create table purchase_order_items (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null,
  po_id uuid not null references purchase_orders(id),
  product_id uuid not null references products(id),
  product_unit_id uuid not null references product_units(id),
  qty_dipesan numeric(12,2) not null,
  qty_diterima numeric(12,2) not null default 0,
  harga_beli_estimasi numeric(12,2),
  catatan text
);
create index idx_po_items on purchase_order_items(po_id);

create table purchase_invoices (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null,
  outlet_id uuid not null references outlets(id),
  nomor_faktur varchar(50) not null,
  po_id uuid references purchase_orders(id),
  supplier_id uuid not null references suppliers(id),
  nomor_faktur_supplier varchar(100),
  tanggal_faktur date not null default current_date,
  tanggal_jatuh_tempo date,
  total numeric(12,2) not null default 0,
  jumlah_dibayar numeric(12,2) not null default 0,
  status faktur_status not null default 'draft',
  catatan text,
  created_by uuid references user_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index idx_faktur_nomor on purchase_invoices(tenant_id, nomor_faktur);
create trigger trg_faktur_updated before update on purchase_invoices
  for each row execute function update_updated_at();

alter table product_batches
  add constraint fk_batches_faktur foreign key (faktur_pembelian_id) references purchase_invoices(id);

create table purchase_invoice_items (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null,
  faktur_id uuid not null references purchase_invoices(id),
  po_item_id uuid references purchase_order_items(id),
  product_id uuid not null references products(id),
  product_unit_id uuid not null references product_units(id),
  qty numeric(12,2) not null,
  harga_beli numeric(12,2) not null,
  subtotal numeric(12,2) generated always as (qty * harga_beli) stored,
  nomor_batch varchar(100) not null,
  tanggal_kadaluarsa date not null,
  catatan text
);
create index idx_faktur_items on purchase_invoice_items(faktur_id);

create table purchase_returns (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null,
  outlet_id uuid not null references outlets(id),
  nomor_retur varchar(50) not null,
  faktur_id uuid not null references purchase_invoices(id),
  supplier_id uuid not null references suppliers(id),
  tanggal_retur date not null default current_date,
  total numeric(12,2) not null default 0,
  alasan retur_alasan not null,
  catatan text,
  created_by uuid references user_profiles(id),
  created_at timestamptz not null default now()
);
create unique index idx_retur_nomor on purchase_returns(tenant_id, nomor_retur);

create table purchase_return_items (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null,
  retur_id uuid not null references purchase_returns(id),
  product_id uuid not null references products(id),
  batch_id uuid not null references product_batches(id),
  qty numeric(12,2) not null,
  alasan text
);
create index idx_purchase_return_items_tenant on purchase_return_items(tenant_id, retur_id);

-- ==============================================================================
-- MODULE 07: MARKETING (WA TEMPLATES, FOLLOWUPS, PROMOS)
-- ==============================================================================
create table wa_templates (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null,
  nama varchar(120) not null,
  kategori varchar(80) not null default 'Follow-up',
  pesan text not null,
  is_aktif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_wa_templates_tenant on wa_templates(tenant_id, kategori);
create trigger trg_wa_templates_updated before update on wa_templates
  for each row execute function update_updated_at();

create table followups (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null,
  contact_id uuid references contacts(id),
  transaction_id uuid references sales_transactions(id),
  nama varchar(200) not null,
  no_wa varchar(30),
  obat varchar(200),
  alasan varchar(120) not null,
  status varchar(30) not null default 'pending',
  tanggal date not null default current_date,
  catatan text,
  template_id uuid references wa_templates(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_followups_tenant on followups(tenant_id, tanggal desc);
create trigger trg_followups_updated before update on followups
  for each row execute function update_updated_at();

create table promos (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null,
  nama varchar(150) not null,
  tipe varchar(30) not null,
  nilai numeric(12,2) not null default 0,
  produk_id uuid references products(id),
  mulai date,
  selesai date,
  deskripsi text,
  status varchar(30) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_promos_tenant on promos(tenant_id, status, mulai, selesai);
create trigger trg_promos_updated before update on promos
  for each row execute function update_updated_at();

-- ==============================================================================
-- MODULE 08: KEUANGAN (FOUNDATION)
-- ==============================================================================
create table journal_entries (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null,
  outlet_id uuid references outlets(id),
  entry_date date not null default current_date,
  source_type varchar(50) not null,
  source_id uuid,
  debit numeric(12,2) not null default 0,
  credit numeric(12,2) not null default 0,
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references user_profiles(id),
  created_at timestamptz not null default now()
);
create index idx_journal_entries_tenant on journal_entries(tenant_id, entry_date desc, source_type);

-- ==============================================================================
-- MODULE 09: KONSINYASI (FOUNDATION)
-- ==============================================================================
create table consignment_entries (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null,
  outlet_id uuid references outlets(id),
  product_id uuid not null references products(id),
  supplier_id uuid references suppliers(id),
  transaction_item_id uuid references sales_transaction_items(id),
  source_type varchar(50) not null,
  source_id uuid,
  qty numeric(12,2) not null,
  amount numeric(12,2) not null default 0,
  status varchar(30) not null default 'pending',
  catatan text,
  created_at timestamptz not null default now()
);
create index idx_consignment_entries_tenant on consignment_entries(tenant_id, status, created_at desc);

-- ==============================================================================
-- VIEWS
-- ==============================================================================
create or replace view defecta_list as
select
  p.id as product_id,
  p.tenant_id,
  p.kode_produk,
  p.nama_dagang,
  p.nama_generik,
  p.stok_minimum,
  p.rata_rata_penjualan_harian,
  coalesce(sum(pb.stok), 0) as total_stok,
  p.stok_minimum - coalesce(sum(pb.stok), 0) as kekurangan,
  ps.supplier_id as supplier_utama_id,
  s.nama as supplier_utama,
  ps.lead_time_hari,
  case
    when p.rata_rata_penjualan_harian is null or p.rata_rata_penjualan_harian = 0 then null
    else round(coalesce(sum(pb.stok), 0) / p.rata_rata_penjualan_harian, 1)
  end as hari_sampai_habis,
  case
    when coalesce(sum(pb.stok), 0) = 0 then 'SEKARANG'
    when p.rata_rata_penjualan_harian is null or p.rata_rata_penjualan_harian = 0 then 'PERIKSA'
    when ps.lead_time_hari is null then 'PERIKSA'
    when round(coalesce(sum(pb.stok), 0) / p.rata_rata_penjualan_harian, 1) <= ps.lead_time_hari then 'SEKARANG'
    when round(coalesce(sum(pb.stok), 0) / p.rata_rata_penjualan_harian, 1) <= ps.lead_time_hari + 3 then 'BESOK'
    else 'RENCANA'
  end as urgency
from products p
left join product_batches pb on pb.product_id = p.id and pb.tenant_id = p.tenant_id and pb.stok > 0
left join product_suppliers ps on ps.product_id = p.id and ps.tenant_id = p.tenant_id and ps.is_supplier_utama = true
left join suppliers s on s.id = ps.supplier_id
where p.is_aktif = true and p.stok_minimum > 0
group by p.id, p.tenant_id, ps.supplier_id, s.nama, ps.lead_time_hari
having coalesce(sum(pb.stok), 0) <= p.stok_minimum
order by case when coalesce(sum(pb.stok), 0) = 0 then 0 else 1 end asc, kekurangan desc;

create or replace view supplier_debt as
select
  s.id as supplier_id,
  s.nama,
  s.tipe,
  count(pi.id) as jumlah_faktur,
  sum(pi.total) as total_hutang,
  sum(pi.jumlah_dibayar) as total_dibayar,
  sum(pi.total) - sum(pi.jumlah_dibayar) as sisa_hutang,
  min(pi.tanggal_jatuh_tempo) as jatuh_tempo_terdekat,
  s.tenant_id
from suppliers s
join purchase_invoices pi on pi.supplier_id = s.id and pi.tenant_id = s.tenant_id
where pi.status = 'diterima' and pi.total - pi.jumlah_dibayar > 0
group by s.id, s.nama, s.tipe, s.tenant_id
order by sisa_hutang desc;

-- ==============================================================================
-- RLS
-- ==============================================================================
alter table tenant_profiles enable row level security;
alter table outlets enable row level security;
alter table user_profiles enable row level security;
alter table units enable row level security;
alter table product_categories enable row level security;
alter table products enable row level security;
alter table product_units enable row level security;
alter table product_barcodes enable row level security;
alter table suppliers enable row level security;
alter table product_suppliers enable row level security;
alter table contacts enable row level security;
alter table shifts enable row level security;
alter table prescriptions enable row level security;
alter table prescription_items enable row level security;
alter table sales_transactions enable row level security;
alter table sales_transaction_items enable row level security;
alter table prescription_validations enable row level security;
alter table product_batches enable row level security;
alter table stock_mutations enable row level security;
alter table stock_opname enable row level security;
alter table stock_opname_items enable row level security;
alter table purchase_orders enable row level security;
alter table purchase_order_items enable row level security;
alter table purchase_invoices enable row level security;
alter table purchase_invoice_items enable row level security;
alter table purchase_returns enable row level security;
alter table purchase_return_items enable row level security;
alter table wa_templates enable row level security;
alter table followups enable row level security;
alter table promos enable row level security;
alter table journal_entries enable row level security;
alter table consignment_entries enable row level security;

do $$
declare
  t text;
begin
  for t in
    select tablename from pg_tables
    where schemaname = 'public'
      and tablename not in ('drug_classifications')
      and tablename not like 'pg_%'
  loop
    execute format(
      'create policy "tenant_isolation" on %I for all using (tenant_id = get_tenant_id()) with check (tenant_id = get_tenant_id())',
      t
    );
  end loop;
end $$;

-- Add core business tables to Supabase Realtime publication when available.
do $$
declare
  tbl text;
begin
  for tbl in
    select unnest(array[
      'products',
      'product_batches',
      'stock_mutations',
      'sales_transactions',
      'sales_transaction_items',
      'purchase_orders',
      'purchase_invoices',
      'contacts',
      'wa_templates',
      'followups',
      'promos'
    ])
  loop
    begin
      execute format('alter publication supabase_realtime add table %I', tbl);
    exception
      when duplicate_object then null;
      when undefined_object then null;
      when undefined_table then null;
    end;
  end loop;
end $$;

-- ==============================================================================
-- STATIC REFERENCE DATA
-- ==============================================================================
insert into drug_classifications (kode, nama, warna_badge) values
  ('bebas', 'Obat Bebas', '#16A34A'),
  ('bebas_terbatas', 'Obat Bebas Terbatas', '#2563EB'),
  ('keras', 'Obat Keras', '#DC2626'),
  ('narkotika', 'Narkotika', '#7C3AED'),
  ('psikotropika', 'Psikotropika', '#EA580C'),
  ('prekursor', 'Prekursor', '#CA8A04'),
  ('vitamin', 'Vitamin / Suplemen', '#0891B2')
on conflict (kode) do nothing;

-- Note: tenant_id = '00000000-0000-0000-0000-000000000000' is the default demo tenant.
