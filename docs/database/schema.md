===== FILE: docs/database/schema.md =====
# 🗄️ Database & Storage Schema

## Table: `products` (Katalog Menu)
- `id` (uuid, PK)
- `name`, `price`, `description`
- `image_url` (Link foto dari bucket `product-images`)

## Table: `team_members` (Profil Tim)
- `id` (uuid, PK)
- `name`, `role`
- `photo_url` (Link foto dari bucket `team-photos`)

## Supabase Storage Buckets
1. `team-photos`: Untuk menyimpan foto profil anggota tim.
2. `product-images`: Untuk menyimpan foto menu produk.
- **RLS Policy**: Public Read (agar pengunjung bisa melihat), Authenticated Upload/Update (hanya admin yang bisa ganti).
===== END FILE =====