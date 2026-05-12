"use client";

import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { ShoppingCart, Info, UtensilsCrossed, ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/store/useCartStore";

export function ProductCard({ product }: { product: any }) {
  const addToCart = useCartStore((state: any) => state.addToCart || state.addItem);

  // STATE BARU: Untuk mengontrol munculnya overlay nutrisi saat foto di-tap (khusus mobile)
  const [showNutrition, setShowNutrition] = useState(false);

  // Mengambil relasi resep dari ERP 
  const recipeData = product.product_ingredients || [];

  const manualIngredients = product.ingredients_text
    ? product.ingredients_text.split(',').map((item: string) => item.trim())
    : [];

  // FUNGSI AUTO-CALCULATE DI SISI PEMBELI (AKURAT DARI SQL)
  const autoTotalKcal = recipeData.length > 0
    ? recipeData.reduce((sum: number, ri: any) => sum + (ri.amount_needed * (ri.ingredients?.calories_per_unit || 0)), 0).toFixed(0)
    : 0;

  const handleAddToCart = () => {
    if (product.stock <= 0) {
      return toast.error("Stok habis!", {
        description: "Mohon maaf, menu ini sedang tidak tersedia."
      });
    }

    if (addToCart) addToCart(product);
    toast.success("Berhasil ditambahkan!", {
      description: "Pesanan Anda sudah dimasukkan ke keranjang.",
      duration: 3000,
      icon: <ShoppingCart className="w-4 h-4" />,
    });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 p-5 flex flex-col shadow-sm hover:shadow-xl transition-all duration-300 h-full group relative overflow-hidden">

      {/* ================= AREA FOTO BESAR & HOVER ================= */}
      <div
        className="relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden bg-zinc-100 mb-5 border border-zinc-100 cursor-pointer"
        onClick={() => setShowNutrition(!showNutrition)}
      >
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-300">
            <ImageIcon className="w-12 h-12" />
          </div>
        )}

        {/* PETUNJUK MOBILE: Ikon Info kecil di pojok kanan agar orang tahu bisa di-tap */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md z-10 sm:hidden">
          <Info className="w-4 h-4 text-primary" />
        </div>

        {/* OVERLAY NUTRITION FACTS */}
        <div className={`absolute inset-0 bg-black/85 text-white p-6 transition-all duration-500 flex flex-col justify-center backdrop-blur-md z-20 ${showNutrition ? 'opacity-100' : 'opacity-0 sm:group-hover:opacity-100'}`}>

          {/* Tombol Close khusus HP */}
          <button
            className="absolute top-4 right-4 sm:hidden text-zinc-400 hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              setShowNutrition(false);
            }}
          >
            <X className="w-5 h-5" />
          </button>

          <h5 className="font-black italic border-b border-white/20 pb-2 mb-4 flex items-center gap-2 text-primary">
            <Info className="w-5 h-5" /> NUTRITION FACTS
          </h5>

          <div className="overflow-y-auto flex-1 pr-1 space-y-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            {recipeData.length > 0 ? (
              recipeData.map((ri: any, i: number) => {
                const cal = (ri.amount_needed * (ri.ingredients?.calories_per_unit || 0)).toFixed(0);
                return (
                  <div key={i} className="flex justify-between items-center text-xs border-b border-white/10 pb-1.5">
                    <span className="flex items-center gap-2 text-zinc-300">
                      <UtensilsCrossed className="w-3.5 h-3.5 text-primary shrink-0" />
                      {ri.ingredients?.name} <span className="opacity-50">({ri.amount_needed}{ri.ingredients?.unit})</span>
                    </span>
                    <span className="font-mono font-bold text-white tracking-widest">{cal} kkal</span>
                  </div>
                );
              })
            ) :
              manualIngredients.length > 0 ? (
                manualIngredients.map((ing: string, i: number) => (
                  <div key={i} className="flex justify-start items-center text-xs border-b border-white/10 pb-1.5">
                    <span className="flex items-center gap-2 text-zinc-300">
                      <UtensilsCrossed className="w-3.5 h-3.5 text-primary shrink-0" />
                      {ing}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-zinc-500 italic">Rincian bahan belum diinput oleh Admin.</p>
              )}
          </div>

          <div className="mt-4 pt-3 border-t-2 border-primary/50 shrink-0">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Total Kalori Auto</p>
                <p className="text-3xl font-black text-primary italic leading-none">
                  {autoTotalKcal} <span className="text-xs text-white not-italic font-medium">kkal</span>
                </p>
              </div>
              <Badge className="bg-primary/20 text-primary border-0 text-[10px] px-3 py-1 font-bold">
                {product.portion_size || "1 Porsi"}
              </Badge>
            </div>
          </div>
        </div>

        {/* INDIKATOR SISA STOK */}
        {product.stock <= 5 && product.stock > 0 && (
          <div className="absolute top-4 left-4 bg-orange-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg z-20 animate-pulse tracking-widest">
            SISA {product.stock} PORSI!
          </div>
        )}
      </div>

      {/* ================= AREA TEKS DESKRIPSI & HARGA ================= */}
      <div className="flex-1 flex flex-col px-1">
        <div className="mb-2">
          <h4 className="font-black text-2xl text-zinc-800 tracking-tight group-hover:text-primary transition-colors">
            {product.name}
          </h4>
          <p className="text-sm text-zinc-500 line-clamp-2 mt-1.5 leading-relaxed font-medium">
            {product.description || "Hidangan sehat dan lezat bebas khawatir."}
          </p>
        </div>

        <div className="mt-auto pt-5 flex items-center justify-between">
          <p className="text-2xl font-black text-primary italic tracking-tighter">
            Rp {product.price?.toLocaleString("id-ID")}
          </p>
          <Button
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className={`rounded-2xl font-black shadow-lg transition-all hover:scale-105 active:scale-95 px-6 py-6 ${product.stock <= 0 ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary/90'}`}
          >
            {product.stock <= 0 ? 'HABIS' : (
              <>
                <ShoppingCart className="w-5 h-5 mr-2" />
                Pesan
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}