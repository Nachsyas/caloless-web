"use client";

import { useCartStore } from "@/store/useCartStore";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Minus, Plus, Trash2, MapPin } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { useState, useEffect } from "react"; // Tambahkan useEffect
import Script from "next/script";

export function CartDrawer() {
  const {
    items,
    removeItem,
    updateQuantity,
    getTotalItems,
    getSubtotal,
    getDiscount,
    getShippingFee,
    getTotal,
    isUinMalang,
    setIsUinMalang,
    clearCart
  } = useCartStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false); // State untuk Hydration Fix

  const totalItems = getTotalItems();

  // Jalankan ini setelah komponen mendarat di browser
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          total: getTotal(),
          discount: getDiscount(),
          shippingFee: getShippingFee(),
          customerDetails: {
            first_name: "Customer Caloless", // Hardcoded for demo, normally from form
            email: "halo@caloless.id",
            phone: "081234567890"
          }
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      // Trigger Snap popup
      // @ts-ignore
      if (window.snap) {
        // @ts-ignore
        window.snap.pay(data.token, {
          onSuccess: function (result: any) {
            console.log("Payment success", result);
            clearCart();
            alert("Pembayaran berhasil! Terima kasih telah membeli produk CALOLESS.");
          },
          onPending: function (result: any) {
            console.log("Payment pending", result);
            alert("Menunggu pembayaran Anda.");
          },
          onError: function (result: any) {
            console.log("Payment error", result);
            alert("Pembayaran gagal!");
          },
          onClose: function () {
            console.log("Customer closed the popup");
          }
        });
      } else {
        alert("Sistem pembayaran belum siap. Silakan refresh halaman.");
      }
    } catch (error) {
      console.error("Failed to checkout", error);
      alert("Checkout gagal: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Script src="https://app.midtrans.com/snap/snap.js" data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY} strategy="lazyOnload" />
      <Sheet>
        <SheetTrigger render={<Button variant="ghost" size="icon" className="relative cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full w-10 h-10 transition-colors" />}>
          <ShoppingCart className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />

          {/* HYDRATION FIX: Tambahkan isMounted di sini */}
          {isMounted && totalItems > 0 && (
            <span className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center translate-x-1/4 -translate-y-1/4 border-2 border-white dark:border-zinc-950">
              {totalItems}
            </span>
          )}
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
          <SheetHeader className="p-6 border-b">
            <SheetTitle className="text-2xl font-bold flex items-center gap-2">
              Keranjang Belanja

              {/* HYDRATION FIX: Tambahkan isMounted juga di badge total keranjang dalam Drawer */}
              {isMounted && (
                <span className="bg-primary/10 text-primary text-sm px-2 py-0.5 rounded-full">
                  {totalItems} item
                </span>
              )}
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="flex-1 p-6">
            {/* HYDRATION FIX: Pastikan konten keranjang hanya dirender jika isMounted true */}
            {!isMounted || items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <ShoppingCart className="w-16 h-16 mb-4 opacity-20" />
                <p>Keranjang kamu masih kosong</p>
              </div>
            ) : (
              <div className="space-y-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-secondary/30 shrink-0 border border-border/50 shadow-sm">
                      <Image src={item.image_url || "/hero.png"} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <h4 className="font-bold text-sm leading-tight line-clamp-2">{item.name}</h4>
                        <p className="text-primary font-bold mt-1.5">Rp {item.price.toLocaleString("id-ID")}</p>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border border-border rounded-lg bg-secondary/30 overflow-hidden">
                          <button className="h-8 w-8 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-colors" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                          <button className="h-8 w-8 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-colors" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button className="h-8 w-8 flex items-center justify-center text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors" onClick={() => removeItem(item.id)}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {isMounted && items.length > 0 && (
            <div className="p-6 border-t bg-secondary/10">
              {/* Promo Selector */}
              <div className="mb-5 bg-white dark:bg-zinc-900 border rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2.5 rounded-xl shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h5 className="text-sm font-bold">Pengiriman UIN Malang?</h5>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">Nikmati <span className="font-semibold text-primary">Gratis Ongkir</span> untuk area kampus!</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" className="sr-only peer" checked={isUinMalang} onChange={(e) => setIsUinMalang(e.target.checked)} />
                    <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>

              <div className="space-y-3.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-medium text-foreground">Rp {getSubtotal().toLocaleString("id-ID")}</span>
                </div>

                {getDiscount() > 0 && (
                  <div className="flex justify-between text-green-600 font-medium bg-green-500/10 p-2 rounded-lg -mx-2 px-2">
                    <span>Promo (Beli 5 Gratis 1)</span>
                    <span>- Rp {getDiscount().toLocaleString("id-ID")}</span>
                  </div>
                )}

                <div className="flex justify-between text-muted-foreground">
                  <span>Ongkir</span>
                  {isUinMalang ? (
                    <span className="text-green-600 font-bold bg-green-500/10 px-2 py-0.5 rounded-md">Gratis</span>
                  ) : (
                    <span className="font-medium text-foreground">Rp {getShippingFee().toLocaleString("id-ID")}</span>
                  )}
                </div>

                <Separator className="my-3" />

                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Belanja</span>
                  <span className="text-2xl text-primary">Rp {getTotal().toLocaleString("id-ID")}</span>
                </div>
              </div>

              <Button
                className="w-full h-14 rounded-full text-base font-bold mt-6 shadow-lg shadow-primary/25 hover:scale-[1.02] transition-transform"
                disabled={items.length === 0 || isLoading}
                onClick={handleCheckout}
              >
                {isLoading ? "Memproses..." : "Checkout Sekarang"}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}