"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js"; // TAMBAHAN: Import klien admin
import { revalidatePath } from "next/cache";

export async function uploadPhotoAction(formData: FormData) {
  const file = formData.get("file") as File;
  const id = formData.get("id") as string;
  const table = formData.get("table") as 'products' | 'team_members';

  if (!file || !id || !table) {
    return { error: "Data tidak lengkap" };
  }

  // Pastikan file adalah gambar
  if (!file.type.startsWith("image/")) {
    return { error: "File harus berupa gambar (JPG, PNG, dsb)" };
  }

  const supabase = await createClient();

  // Cek apakah user sudah login
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  const bucket = table === 'products' ? 'product-images' : 'team-photos';

  // Buat nama file unik
  const fileExt = file.name.split('.').pop();
  const fileName = `${id}-${Date.now()}.${fileExt}`;

  // 1. Upload ke Supabase Storage (File Fisik)
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return { error: `Gagal mengunggah gambar: ${uploadError.message}` };
  }

  // Dapatkan URL Publik dari gambar yang baru diupload
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);

  // Tentukan nama kolom yang benar
  const updateData = table === 'products'
    ? { image_url: publicUrl }
    : { photo_url: publicUrl };

  // 2. Gunakan KUNCI MASTER untuk UPDATE Database (Bypass RLS)
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error: dbError } = await supabaseAdmin
    .from(table)
    .update(updateData)
    .eq("id", id);

  if (dbError) {
    console.error("DB Update error:", dbError);
    return { error: `Gagal menyimpan URL ke database: ${dbError.message}` };
  }

  // Refresh UI secara instan
  revalidatePath("/");
  revalidatePath("/admin/dashboard");

  return { success: true, url: publicUrl };
}