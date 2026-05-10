===== FILE: docs/features/feature-summary.md =====
# 📋 Detail Fitur Admin & Management

## 1. Admin Dashboard (`/admin`)
- **Login System**: Sistem masuk khusus tim menggunakan Supabase Auth.
- **Management UI**: Daftar anggota tim dengan tombol aksi **"Change Photo"**.
- **Live Upload**: Mengizinkan admin memilih file dari laptop/HP, lalu secara otomatis mengupdate foto profil anggota tim di halaman Landing Page secara real-time.

## 2. Dynamic Team Section
- Data anggota tim (Nama, Role, Foto) tidak boleh di-*hardcode*.
- Komponen harus melakukan *fetch* ke tabel `team_members`.
- Jika admin mengganti foto melalui dashboard, foto di Landing Page otomatis berubah.

## 3. E-Commerce & Animations
- Quick Cart (Zustand) dengan logika Promo 5 Gratis 1.
- Smooth Animations (Framer Motion) saat scroll (Scroll Reveal).
- Integrated Payment Gateway (Midtrans/Xendit).
===== END FILE =====