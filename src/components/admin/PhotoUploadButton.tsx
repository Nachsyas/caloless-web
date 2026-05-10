"use client";

import { useState, useRef } from "react";
import { uploadPhotoAction } from "@/app/actions/upload";
import { Button } from "@/components/ui/button";
import { ImageIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation"; // TAMBAHAN 1

interface PhotoUploadButtonProps {
  id: string;
  table: "products" | "team_members";
}

export function PhotoUploadButton({ id, table }: PhotoUploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter(); // TAMBAHAN 2

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("id", id);
    formData.append("table", table);

    try {
      const res = await uploadPhotoAction(formData);
      if (res.error) {
        alert(res.error);
      } else {
        // TAMBAHAN 3: Perintahkan Next.js untuk menarik data terbaru ke layar
        router.refresh();
      }
    } catch (err: any) {
      alert("Terjadi kesalahan saat mengunggah foto.");
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        variant="outline"
        size="sm"
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
        className="gap-2 rounded-full border-primary/20 hover:bg-primary/10 hover:text-primary transition-colors"
      >
        {isUploading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ImageIcon className="w-4 h-4" />
        )}
        {isUploading ? "Mengunggah..." : "Ganti Foto"}
      </Button>
    </div>
  );
}