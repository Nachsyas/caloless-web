===== FILE: AGENTS.md =====
# Next.js App Router Optimized
Gunakan Server Actions untuk semua mutasi data (upload file & update database). Pastikan konfigurasi 'images.remotePatterns' di next.config.js mencakup domain Supabase.
# CALOLESS Web Platform — AI Agent Instructions

## 🏗️ Tech Stack (Full Admin Edition)
- **Framework**: Next.js App Router (TypeScript).
- **Admin & Auth**: Supabase Auth (Untuk memproteksi halaman /admin agar hanya tim yang bisa masuk).
- **Storage**: Supabase Storage (Bucket: `team-photos` dan `product-images`).
- **Database**: PostgreSQL (Tabel `team_members` dan `products`).

## 🔒 Aturan Manajemen Konten (ADMIN)
1. **Zero Hardcode**: Semua foto (Tim & Menu) wajib diambil dari database. Jangan simpan aset secara statis di folder public.
2. **Admin Dashboard (/admin)**: Buat halaman khusus yang memiliki tombol "Ganti Foto" untuk tiap anggota dan tiap menu produk.
3. **Upload Workflow**: Pilih file -> Upload ke Supabase Storage -> Update URL di database -> Refresh UI secara otomatis.
===== END FILE =====