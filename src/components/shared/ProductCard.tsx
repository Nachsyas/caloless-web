"use client";

import Image from "next/image";
import { toast } from "sonner";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/useCartStore";

export function ProductCard({ product }: { product: any }) {
  // Memanggil fungsi dari Zustand store kamu
  // Catatan: Jika di useCartStore.ts nama fungsinya 'addItem', ganti 'state.addToCart' menjadi 'state.addItem'
  const addToCart = useCartStore((state: any) => state.addToCart || state.addItem);

  const handleAddToCart = () => {
    // 1. Memasukkan data produk ke dalam state keranjang
    if (addToCart) {
      addToCart(product);
    }

    // 2. Memunculkan notifikasi sukses di bawah layar
    toast.success("Berhasil ditambahkan!", {
      description: "Pesanan Anda sudah dimasukkan ke keranjang. Silakan cek ikon keranjang 🛒 di atas.",
      duration: 3000, // Notifikasi akan hilang dalam 3 detik
      icon: <ShoppingCart className="w-4 h-4" />,
    });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border p-5 flex flex-col shadow-sm hover:shadow-md transition-shadow h-full">
      {/* Area Gambar Produk */}
      <div className="relative w-full h-48 rounded-xl overflow-hidden bg-secondary mb-4 border border-border">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
            No Image
          </div>
        )}
      </div>

      {/* Area Detail Produk */}
      <div className="flex-1 flex flex-col">
        <h4 className="font-bold text-lg mb-1">{product.name}</h4>

        {product.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        <p className="text-lg font-extrabold text-primary mt-auto mb-4">
          Rp {product.price?.toLocaleString("id-ID")}
        </p>

        {/* Tombol Pesan dengan animasi klik */}
        <Button
          onClick={handleAddToCart}
          className="w-full gap-2 rounded-full font-bold shadow-sm hover:scale-[1.02] active:scale-95 transition-all"
        >
          <ShoppingCart className="w-4 h-4" />
          Pesan Sekarang
        </Button>
      </div>
    </div>
  );
}