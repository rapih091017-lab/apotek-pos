# Module PRD — Settings / Profil Tenant
### Bagian dari: Sistem POS & ERP Apotek
Versi: 1.0 | Status: Final

---

## 1. Ringkasan

Modul untuk mengelola profil apotek — nama, alamat, kontak, logo, footer struk, dan preferensi. Data dari sini dipakai di header aplikasi, cetak struk, dan footer seluruh halaman.

---

## 2. Skema Data

### 2.1 `tenant_profiles` — Profil Apotek per Tenant

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK, unique — 1 tenant = 1 profil |
| nama_apotek | varchar(200) | Nama apotek (muncul di header & struk) |
| alamat | text, nullable | Alamat lengkap |
| kota | varchar(100), nullable | |
| telepon | varchar(30), nullable | |
| email | varchar(100), nullable | |
| logo_url | text, nullable | URL logo (untuk header & struk) |
| footer_struk | text, nullable | Teks footer di struk (mis. "Terima kasih — obat tidak bisa ditukar") |
| default_outlet_id | uuid, nullable | Outlet default saat login |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### 2.2 `outlets` — Outlet / Cabang

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | |
| nama | varchar(100) | Nama outlet/cabang |
| alamat | text, nullable | |
| telepon | varchar(30), nullable | |
| is_aktif | boolean, default true | |
| created_at | timestamptz | |

---

## 3. Form Settings

```
┌──────────────────────────────────────────┐
│  ⚙️ Settings — Profil Apotek             │
│  ────────────────────────────────────── │
│                                          │
│  INFORMASI APOTEK                       │
│  ┌────────────────────────────────────┐ │
│  │ Nama Apotek * [Apotek Sehat Sentosa│ │
│  │ Alamat        [Jl. Kesehatan No. 12│ │
│  │ Kota          [Jakarta            ]│ │
│  │ Telepon       [021-1234567        ]│ │
│  │ Email         [apotek@email.com   ]│ │
│  └────────────────────────────────────┘ │
│                                          │
│  LOGO                                    │
│  ┌────────────────────────────────────┐ │
│  │ [Logo Preview]   Upload Logo       │ │
│  │ Rekomendasi: 200×60px, PNG        │ │
│  └────────────────────────────────────┘ │
│                                          │
│  STRUK                                   │
│  ┌────────────────────────────────────┐ │
│  │ Footer Struk:                      │ │
│  │ [Terima kasih — obat tidak bisa   ]│ │
│  │ [ditukar kembali                  ]│ │
│  └────────────────────────────────────┘ │
│                                          │
│  OUTLET                                  │
│  ┌────────────────────────────────────┐ │
│  │ [+ Tambah Outlet]                  │ │
│  │ ──────────────────────────────── │ │
│  │ Pusat · Jl. Kesehatan 12   [Edit] │ │
│  │ Cabang 2 · Jl. Melati 5    [Edit] │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │           💾 Simpan                │ │
│  └────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

---

## 4. Build Prompt

```
Bangun modul Settings untuk aplikasi apotek:
- Tabel tenant_profiles (1:1 dengan tenant)
- Tabel outlets
- Form setting: nama apotek, alamat, telepon, email, upload logo, footer struk
- CRUD outlets
- Data dipakai di header aplikasi & cetak struk
```
