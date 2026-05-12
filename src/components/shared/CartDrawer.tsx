"use client";

import { useCartStore } from "@/store/useCartStore";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Minus, Plus, Trash2, Store, Truck, Map, Navigation } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { useState, useEffect } from "react";
import Script from "next/script";
import { toast } from "sonner";

// Koordinat UIN Malang (Latitude, Longitude)
const UIN_MALANG_COORDS = { lat: -7.951381, lon: 112.607424 };

// Haversine Formula untuk menghitung jarak (dalam KM)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius bumi dalam KM
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export function CartDrawer() {
  const { items, removeItem, updateQuantity, getTotalItems, getSubtotal, getDiscount, clearCart } = useCartStore();

  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);

  // State untuk Form Pembeli
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("pickup");
  const [address, setAddress] = useState("");

  // State untuk Ongkir
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [calculatedShipping, setCalculatedShipping] = useState(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fungsi untuk update state kalkulasi berdasarkan jarak
  const applyShippingCalculation = (distance: number) => {
    setDistanceKm(distance);
    if (distance <= 2) {
      setCalculatedShipping(0);
      toast.success(`Jarak ${distance.toFixed(1)} km (Radius UIN). Bebas Ongkir!`);
    } else {
      const excessDistance = distance - 2;
      const feeMultiplier = Math.ceil(excessDistance / 2);
      const fee = feeMultiplier * 2000;
      setCalculatedShipping(fee);
      toast.success(`Jarak ${distance.toFixed(1)} km. Ongkir: Rp ${fee.toLocaleString("id-ID")}`);
    }
  };

  // FUNGSI BARU: Ambil Koordinat Otomatis via GPS Browser
  const getCurrentLocationGPS = () => {
    if (!navigator.geolocation) {
      toast.error("Browser HP/Laptop kamu tidak mendukung fitur GPS.");
      return;
    }

    setIsCheckingLocation(true);
    toast.info("Meminta izin akses lokasi GPS...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const distance = calculateDistance(UIN_MALANG_COORDS.lat, UIN_MALANG_COORDS.lon, latitude, longitude);

        applyShippingCalculation(distance);

        // Isi otomatis text area alamat jika masih kosong
        if (!address) {
          setAddress("Alamat dari GPS: [Tulis patokan rumah/pagar di sini...]");
        }
        setIsCheckingLocation(false);
      },
      (error) => {
        setIsCheckingLocation(false);
        console.error(error);
        toast.error("Gagal! Pastikan GPS HP menyala dan kamu mengizinkan akses lokasi untuk web ini.");
      },
      { enableHighAccuracy: true }
    );
  };

  // Fungsi fallback: Cek manual via nama jalan (API OSM)
  const checkAddressManual = async () => {
    if (!address || address.length < 5) {
      toast.error("Ketik minimal nama jalan atau kecamatan.");
      return;
    }

    setIsCheckingLocation(true);
    try {
      const searchQuery = encodeURIComponent(`${address}, Malang`);
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}`);
      const data = await response.json();

      if (data && data.length > 0) {
        const targetLat = parseFloat(data[0].lat);
        const targetLon = parseFloat(data[0].lon);
        const distance = calculateDistance(UIN_MALANG_COORDS.lat, UIN_MALANG_COORDS.lon, targetLat, targetLon);
        applyShippingCalculation(distance);
      } else {
        toast.error("Jalan tidak terbaca. Saran: Gunakan tombol 'Lacak Lokasi Otomatis' di atas.");
        setDistanceKm(null);
        setCalculatedShipping(0);
      }
    } catch (error) {
      toast.error("Sistem peta sedang gangguan.");
    } finally {
      setIsCheckingLocation(false);
    }
  };

  // Kalkulasi Total Keseluruhan
  const subtotal = getSubtotal();
  const discount = getDiscount();
  const finalTotal = subtotal - discount + (deliveryType === "delivery" ? calculatedShipping : 0);

  const handleCheckout = async () => {
    if (!customerName || !customerPhone) {
      toast.error("Mohon isi Nama dan Nomor WhatsApp.");
      return;
    }
    if (deliveryType === "delivery" && distanceKm === null) {
      toast.error("Silakan cek/lacak lokasi alamatmu terlebih dahulu untuk menghitung ongkir.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          total: finalTotal,
          discount: discount,
          shippingFee: deliveryType === "delivery" ? calculatedShipping : 0,
          customerDetails: {
            first_name: customerName,
            phone: customerPhone,
            address: deliveryType === "pickup" ? "Ambil di Tempat (UIN Malang)" : `${address} (Jarak: ${distanceKm?.toFixed(1)}km)`
          }
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      // @ts-ignore
      if (window.snap) {
        // @ts-ignore
        window.snap.pay(data.token, {
          onSuccess: function () {
            clearCart();
            toast.success("Pembayaran Berhasil! Pesanan akan segera diproses.");
          },
          onPending: function () { toast.info("Menunggu Pembayaran."); },
          onError: function () { toast.error("Pembayaran Gagal."); },
          onClose: function () { console.log("Snap closed."); }
        });
      }
    } catch (error: any) {
      toast.error("Checkout gagal: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) return null;

  return (
    <>
      <Script src="https://app.midtrans.com/snap/snap.js" data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY} strategy="lazyOnload" />
      <Sheet>

        {/* PERBAIKAN 1: SheetTrigger langsung diberi styling tombol tanpa menggunakan <Button asChild> */}
        <SheetTrigger className="relative flex items-center justify-center cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full w-10 h-10 transition-colors focus:outline-none">
          <ShoppingCart className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
          {getTotalItems() > 0 && (
            <span className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center translate-x-1/4 -translate-y-1/4 border-2 border-white">
              {getTotalItems()}
            </span>
          )}
        </SheetTrigger>

        {/* PERBAIKAN 2: Menggunakan h-[100dvh] dan overflow-hidden agar terhindar dari bug viewport Chrome */}
        <SheetContent className="w-full sm:max-w-md flex flex-col p-0 h-[100dvh] max-h-screen overflow-hidden bg-white dark:bg-zinc-950">

          <SheetHeader className="p-4 border-b shrink-0 bg-white dark:bg-zinc-950 z-10">
            <SheetTitle className="text-xl font-bold">Keranjang & Checkout</SheetTitle>
          </SheetHeader>

          {/* PERBAIKAN 3: ScrollArea dibuang, diganti div dengan flex-1 overflow-y-auto */}
          <div className="flex-1 overflow-y-auto px-4 py-4 hide-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mb-2 opacity-20" />
                <p>Keranjang kamu masih kosong</p>
              </div>
            ) : (
              <div className="space-y-6 pb-6">

                {/* 1. DAFTAR PESANAN */}
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-secondary border">
                        <Image src={item.image_url || "/hero.png"} alt={item.name} fill className="object-cover" sizes="80px" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <h4 className="font-bold text-sm leading-tight line-clamp-1">{item.name}</h4>
                          <p className="text-primary font-bold text-sm mt-1">Rp {item.price.toLocaleString("id-ID")}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border rounded-lg bg-secondary/30">
                            <button className="h-7 w-7 flex justify-center items-center" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-semibold">{item.quantity}</span>
                            <button className="h-7 w-7 flex justify-center items-center" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <button className="text-red-500 hover:bg-red-50 p-1.5 rounded-md" onClick={() => removeItem(item.id)}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* 2. FORM DATA PEMBELI */}
                <div className="space-y-4">
                  <h3 className="font-bold text-sm flex items-center gap-2">Data Pemesan</h3>
                  <div className="grid gap-3">
                    <input
                      type="text"
                      placeholder="Nama Lengkap"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    />
                    <input
                      type="tel"
                      placeholder="Nomor WhatsApp aktif"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>
                </div>

                {/* 3. METODE PENGIRIMAN */}
                <div className="space-y-4">
                  <h3 className="font-bold text-sm flex items-center gap-2">Metode Pengambilan</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setDeliveryType("pickup")}
                      className={`flex flex-col items-center justify-center gap-2 p-3 border rounded-xl transition-all ${deliveryType === "pickup" ? "border-primary bg-primary/5 text-primary" : "hover:bg-secondary/50 text-muted-foreground"}`}
                    >
                      <Store className="w-6 h-6" />
                      <span className="text-xs font-bold">Ambil di UIN</span>
                    </button>
                    <button
                      onClick={() => { setDeliveryType("delivery"); setDistanceKm(null); }}
                      className={`flex flex-col items-center justify-center gap-2 p-3 border rounded-xl transition-all ${deliveryType === "delivery" ? "border-primary bg-primary/5 text-primary" : "hover:bg-secondary/50 text-muted-foreground"}`}
                    >
                      <Truck className="w-6 h-6" />
                      <span className="text-xs font-bold">Delivery</span>
                    </button>
                  </div>

                  {/* FORM ALAMAT (Jika Delivery) */}
                  {deliveryType === "delivery" && (
                    <div className="bg-secondary/20 p-3 rounded-xl border border-border mt-3 space-y-3">

                      <Button
                        size="sm"
                        variant="default"
                        className="w-full gap-2 shadow-sm"
                        onClick={getCurrentLocationGPS}
                        disabled={isCheckingLocation}
                      >
                        <Navigation className="w-4 h-4" />
                        {isCheckingLocation ? "Memindai Satelit..." : "📍 Lacak Lokasi Saya Otomatis (GPS)"}
                      </Button>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-secondary/20 px-2 text-muted-foreground">atau tulis alamat detail</span></div>
                      </div>

                      <textarea
                        placeholder="Jln Simpang sunan Kalijaga 1 no 15 RT 02 RW 07..."
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      />

                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full gap-2 border-primary/20"
                        onClick={checkAddressManual}
                        disabled={isCheckingLocation || !address}
                      >
                        <Map className="w-4 h-4" />
                        Cek Ongkir via Teks
                      </Button>

                      {distanceKm !== null && (
                        <div className="bg-white dark:bg-zinc-900 border p-2 rounded-lg text-xs flex justify-between items-center shadow-sm mt-2">
                          <span>Jarak: <strong>{distanceKm.toFixed(1)} km</strong></span>
                          <span className={calculatedShipping === 0 ? "text-green-600 font-bold" : "text-primary font-bold"}>
                            {calculatedShipping === 0 ? "GRATIS" : `+ Rp ${calculatedShipping.toLocaleString("id-ID")}`}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 4. TOTAL & CHECKOUT BUTTON (PERBAIKAN: shrink-0 agar tidak terdorong) */}
          {items.length > 0 && (
            <div className="p-5 border-t bg-white dark:bg-zinc-950 shrink-0 z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal Pesanan</span>
                  <span className="font-medium">Rp {subtotal.toLocaleString("id-ID")}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Promo (Beli 5 Gratis 1)</span>
                    <span>- Rp {discount.toLocaleString("id-ID")}</span>
                  </div>
                )}
                {deliveryType === "delivery" && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Ongkos Kirim</span>
                    {distanceKm === null ? (
                      <span className="text-orange-500 italic text-xs">Cek alamat dulu</span>
                    ) : calculatedShipping === 0 ? (
                      <span className="text-green-600 font-bold">Gratis</span>
                    ) : (
                      <span className="font-medium">Rp {calculatedShipping.toLocaleString("id-ID")}</span>
                    )}
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between items-center text-base font-bold">
                  <span>Total Pembayaran</span>
                  <span className="text-xl text-primary">Rp {finalTotal.toLocaleString("id-ID")}</span>
                </div>
              </div>

              <Button
                className="w-full h-12 rounded-full text-base font-bold shadow-lg"
                disabled={isLoading || (deliveryType === "delivery" && distanceKm === null)}
                onClick={handleCheckout}
              >
                {isLoading ? "Memproses..." : "Bayar Sekarang"}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}