# Module PRD — Autentikasi & Login
### Bagian dari: Sistem POS & ERP Apotek
Versi: 1.0 | Status: Final

---

## 1. Ringkasan

Modul autentikasi adalah gerbang masuk ke seluruh aplikasi. Menangani login, logout, session, dan redirect ke Dashboard.

Untuk production: pakai Supabase Auth (email/password + social login opsional). Untuk MVP preview: localStorage-based auth.

---

## 2. Alur

```
Login → pilih role (owner/admin/kasir) → Dashboard
     → kalau belum login → redirect ke Login
     → kalau sudah login → langsung Dashboard
Logout → hapus session → Login
```

---

## 3. State yang disimpan (localStorage, production nanti Supabase)

| Key | Tipe | Keterangan |
|-----|------|-----------|
| `apotek_pos_logged_in` | boolean | Status login |
| `apotek_pos_role` | string | `owner` / `admin` / `kasir` |
| `apotek_pos_user` | string | Nama user |
| `apotek_pos_avatar` | string | Initial avatar |
| `apotek_pos_email` | string | Email/username |
| `apotek_pos_profile_name` | string | Nama apotek (dari Settings) |
| `apotek_pos_outlet` | string | Outlet aktif |
| `apotek_pos_shift_active` | boolean | Shift kasir aktif? (dari Kasir) |
| `apotek_pos_shift_modal_awal` | number | Modal awal shift |

---

## 4. Build Prompt

```
Bangun modul autentikasi:
- Halaman login (email + password + pilih role untuk demo)
- Simpan session ke localStorage (production: Supabase Auth JWT)
- Check login di setiap halaman (redirect ke login jika belum)
- Logout (clear session)
- Redirect ke Dashboard setelah login
```
