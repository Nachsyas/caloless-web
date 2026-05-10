"use client";

import Image from "next/image";
import { toast } from "sonner";
import { ShoppingCart, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/useCartStore";

// Fungsi pencari nutrisi berdasarkan NAMA produk (Lebih aman dari ID Supabase)
const getNutrition = (productName: string) => {
  if (!productName) return null;
  const name = productName.toLowerCase();

  if (name.includes("zensum") || name.includes("dimsum")) {
    return {
      ingredients: [
        { name: "Dada Ayam (500gr)", kcal: 825 },
        { name: "Keju (50gr)", kcal: 200 },
        { name: "Kulit Kembang Tahu", kcal: 170 },
        { name: "Udang (150gr)", kcal: 149 },
        { name: "Telur (2 buah)", kcal: 143 },
        { name: "Minyak Wijen (2 sdm)", kcal: 240 },
        { name: "Wortel & Daun Bawang", kcal: 50 },
        { name: "Bumbu (Saus tiram, dll)", kcal: 30 },
      ],
      totalKcal: 1807,
      note: "Total kalori di atas adalah per adonan. Estimasi 1 Porsi (3 biji) = 180 kkal."
    };
  }

  if (name.includes("chia") || name.includes("cheese")) {
    return {
      ingredients: [
        { name: "Keju (30gr)", kcal: 120 },
        { name: "Ubi Ungu (100gr)", kcal: 86 },
        { name: "Chia Seeds (15gr)", kcal: 73 },
        { name: "Susu Low Fat (100ml)", kcal: 43 },
      ],
      totalKcal: 322,
      note: "Kalori per 1 porsi dessert."
    };
  }

  if (name.includes("drink") || name.includes("minuman") || name.includes("ubi")) {
    return {
      ingredients: [
        { name: "Ubi Ungu (150gr)", kcal: 129 },
        { name: "Susu Low Fat (200ml)", kcal: 86 },
        { name: "Air Mineral & Es Batu", kcal: 0 },
        { name: "Gula Stevia", kcal: 0 },
      ],
      totalKcal: 215,
      note: "Kalori per 1 gelas porsi."
    };
  }

  return null;
};

export function ProductCard({ product }: { product: any }) {
  const addToCart = useCartStore((state: any) => state.addToCart || state.addItem);

  // Mengambil data kalori berdasarkan nama produk
  const nutrition = getNutrition(product.name);

  const handleAddToCart = () => {
    if (addToCart) addToCart(product);
    toast.success("Berhasil ditambahkan!", {
      description: "Pesanan Anda sudah dimasukkan ke keranjang.",
      duration: 3000,
      icon: <ShoppingCart className="w-4 h-4" />,
    });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border p-5 flex flex-col shadow-sm hover:shadow-md transition-shadow h-full group relative overflow-hidden">

      {/* Area Gambar Produk */}
      <div className="relative w-full h-56 rounded-xl overflow-hidden bg-secondary mb-4 border border-border cursor-pointer">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No Image</div>
        )}

        {/* Overlay Ingredients & Kalori (Muncul saat cursor diletakkan di atas gambar) */}
        {nutrition && (
          <div className="absolute inset-0 bg-black/85 text-white p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center backdrop-blur-sm z-10">
            <h5 className="font-bold border-b border-white/20 pb-2 mb-2 flex items-center gap-2 text-sm">
              <Info className="w-4 h-4 text-primary" /> Nutrition Facts
            </h5>
            <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar">
              <ul className="space-y-1.5 text-[11px] sm:text-xs">
                {nutrition.ingredients.map((ing: any, i: number) => (
                  <li key={i} className="flex justify-between items-center border-b border-white/5 pb-1">
                    <span className="text-gray-300 pr-2">{ing.name}</span>
                    <span className="font-mono text-primary font-bold shrink-0">{ing.kcal} kcal</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-2 pt-2 border-t border-white/20 shrink-0">
              <div className="flex justify-between items-center font-bold text-sm">
                <span>Total</span>
                <span className="text-primary">{nutrition.totalKcal} kcal</span>
              </div>
              <p className="text-[9px] text-gray-400 mt-1 leading-tight">{nutrition.note}</p>
            </div>
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