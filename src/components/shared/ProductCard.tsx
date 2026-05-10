"use client";

import Image from "next/image";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/useCartStore";
import { div } from "framer-motion/client";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  calories: number;
  image_url: string;
  is_available: boolean;
}

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);
  // Use a fallback image if image_url is missing or invalid
  const imageUrl = product.image_url || "/hero.png";

  return (
    <div className="group bg-white dark:bg-zinc-900 border border-border rounded-3xl overflow-hidden shadow-sm hover:shadow-[0_0_30px_rgba(178,141,255,0.3)] hover:-translate-y-2 transition-all duration-500 flex flex-col h-full">
      {/* 1. Tambahkan 'h-full' di div paling luar agar card selalu mengisi penuh ruang grid-nya */}
      <div className="relative w-full aspect-square bg-secondary/30 overflow-hidden p-6 flex items-center justify-center">
        <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl border-4 border-white/50 dark:border-white/10 group-hover:scale-105 transition-transform duration-500">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover"
          />
        </div>
        {!product.is_available && (
          <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full z-10">
            Habis
          </div>
        )}
        <div className="absolute top-4 left-4 bg-white/90 dark:bg-black/80 backdrop-blur-sm text-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm z-10">
          <span>🔥</span> {product.calories} kkal
        </div>
      </div>

  {/* 2. Container teks ini sudah benar menggunakan flex-1 */ }
  <div className="p-6 flex flex-col flex-1">
    <h3 className="text-xl font-bold mb-2">{product.name}</h3>

    {/* 3. Ganti flex-1 dengan min-h-[2.5rem] pada paragraf agar konsisten tinggi 2 baris */}
    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[2.5rem]">
      {product.description}
    </p>

    {/* 4. mt-auto akan berfungsi maksimal mendorong bagian ini ke dasar card */}
    <div className="flex items-center justify-between mt-auto">
      <span className="text-lg font-bold text-primary">
        Rp {product.price.toLocaleString("id-ID")}
      </span>
      <Button
        size="sm"
        className="rounded-full h-10 px-4 gap-2 hover:scale-105 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
        disabled={!product.is_available}
        onClick={() => addItem(product)}
      >
        <Plus className="w-4 h-4" />
        Tambah
      </Button>
    </div>
  </div>
    </div >
  );
}