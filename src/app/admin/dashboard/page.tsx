"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Package, MapPin, History, LayoutDashboard, Utensils, Users } from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"orders" | "menu" | "team">("orders");
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchOrders();
    fetchProducts();

    const orderChannel = supabase.channel("realtime-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchOrders())
      .subscribe();

    return () => { supabase.removeChannel(orderChannel); };
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (data) setOrders(data);
    setLoading(false);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("id", { ascending: true });
    if (data) setProducts(data);
  };

  const handleCompleteOrder = async (orderId: string) => {
    const { error } = await supabase.from("orders").update({ status: "success" }).eq("id", orderId);
    if (!error) toast.success("Pesanan dipindahkan ke Riwayat.");
  };

  // FUNGSI CRUD MENU Sederhana (Untuk test Real-time)
  const updateProductPrice = async (id: string, newPrice: number) => {
    const { error } = await supabase.from("products").update({ price: newPrice }).eq("id", id);
    if (!error) {
      toast.success("Harga diupdate! Halaman pembeli otomatis berubah.");
      fetchProducts();
    }
  };

  if (loading) return <div className="p-10 text-center flex flex-col items-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div><p className="mt-4">Memuat data server...</p></div>;

  const activeOrders = orders.filter(o => o.status === "pending" || o.status === "paid");
  const historyOrders = orders.filter(o => o.status === "success");

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* SIDEBAR / TOPBAR NAVIGASI ADMIN */}
      <div className="bg-white dark:bg-zinc-900 border-b p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-extrabold tracking-tight text-primary">CALOLESS <span className="text-zinc-500 font-medium">| Admin Center</span></h1>
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
            <button onClick={() => setActiveTab("orders")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "orders" ? "bg-white dark:bg-zinc-700 shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              <LayoutDashboard className="w-4 h-4" /> Pesanan
            </button>
            <button onClick={() => setActiveTab("menu")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "menu" ? "bg-white dark:bg-zinc-700 shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              <Utensils className="w-4 h-4" /> Menu
            </button>
            <button onClick={() => setActiveTab("team")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "team" ? "bg-white dark:bg-zinc-700 shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              <Users className="w-4 h-4" /> Tim
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {/* TAB 1: PESANAN */}
        {activeTab === "orders" && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Tabel Pesanan Aktif */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-orange-600 font-bold">
                <Clock className="w-5 h-5" /><h2>Pesanan Aktif ({activeOrders.length})</h2>
              </div>
              <div className="grid gap-4">
                {activeOrders.map((order) => (
                  <div key={order.id} className="bg-white dark:bg-zinc-900 border rounded-2xl p-5 shadow-sm flex flex-col md:flex-row justify-between gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Badge variant={order.status === "paid" ? "default" : "outline"} className="capitalize">{order.status}</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString("id-ID")}</span>
                      </div>
                      <h3 className="text-lg font-bold">{order.user_name} <span className="text-sm font-normal text-muted-foreground">({order.customer_phone})</span></h3>
                      <div className="text-sm space-y-1">
                        {order.items_json.map((item: any, i: number) => (
                          <p key={i} className="flex gap-2"><Package className="w-4 h-4 text-primary" /> {item.quantity}x {item.name}</p>
                        ))}
                      </div>
                      <p className="text-xs flex items-center gap-1 text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" /> {order.address}
                      </p>
                    </div>
                    <div className="flex flex-col items-end justify-between gap-4">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Total Bayar</p>
                        <p className="text-xl font-black text-primary">Rp {order.total_amount?.toLocaleString("id-ID")}</p>
                      </div>
                      <Button onClick={() => handleCompleteOrder(order.id)} className="bg-green-600 hover:bg-green-700 text-white gap-2 rounded-full">
                        <CheckCircle2 className="w-4 h-4" /> Pesanan Selesai
                      </Button>
                    </div>
                  </div>
                ))}
                {activeOrders.length === 0 && <div className="text-center py-10 bg-white border rounded-xl text-muted-foreground">Belum ada pesanan aktif.</div>}
              </div>
            </section>

            {/* Tabel Riwayat */}
            <section className="space-y-4 pt-4">
              <div className="flex items-center gap-2 text-zinc-500 font-bold">
                <History className="w-5 h-5" /><h2>Riwayat Pembelian</h2>
              </div>
              <div className="overflow-x-auto border rounded-2xl bg-white dark:bg-zinc-900">
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-50 dark:bg-zinc-800 text-xs uppercase font-bold text-muted-foreground border-b">
                    <tr>
                      <th className="px-6 py-4">Pemesan</th>
                      <th className="px-6 py-4">Item & Qty</th>
                      <th className="px-6 py-4 text-center">Total Qty</th>
                      <th className="px-6 py-4 text-right">Belanja</th>
                      <th className="px-6 py-4 text-right">Ongkir</th>
                      <th className="px-6 py-4 text-right">Grand Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {historyOrders.map((order) => {
                      const totalQty = order.items_json.reduce((acc: number, curr: any) => acc + curr.quantity, 0);
                      return (
                        <tr key={order.id} className="hover:bg-zinc-50/50">
                          <td className="px-6 py-4 font-medium">{order.user_name}</td>
                          <td className="px-6 py-4 text-xs">{order.items_json.map((item: any) => `${item.name} (${item.quantity})`).join(", ")}</td>
                          <td className="px-6 py-4 text-center font-bold">{totalQty}</td>
                          <td className="px-6 py-4 text-right italic">Rp {order.subtotal_amount?.toLocaleString("id-ID")}</td>
                          <td className="px-6 py-4 text-right text-orange-600 font-medium">Rp {order.shipping_fee?.toLocaleString("id-ID")}</td>
                          <td className="px-6 py-4 text-right font-black text-primary">Rp {order.total_amount?.toLocaleString("id-ID")}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: MANAJEMEN MENU */}
        {activeTab === "menu" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Katalog Produk (Real-time Test)</h2>
              <Button>+ Tambah Menu Baru</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {products.map((p) => (
                <div key={p.id} className="bg-white border rounded-2xl p-5 shadow-sm">
                  <h3 className="font-bold text-lg mb-2">{p.name}</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => updateProductPrice(p.id, p.price + 1000)}>Naik Harga</Button>
                    <Button variant="outline" size="sm" onClick={() => updateProductPrice(p.id, p.price - 1000)}>Turun Harga</Button>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">Harga Saat ini: <strong className="text-primary">Rp {p.price.toLocaleString()}</strong></p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg border border-blue-100">
              💡 <b>TUTORIAL TEST:</b> Buka halaman pembeli di HP/Tab baru. Lalu klik tombol "Naik Harga" di atas. Lihat halaman pembeli, harganya akan berubah sendiri tanpa di-refresh!
            </p>
          </div>
        )}

        {/* TAB 3: TIM */}
        {activeTab === "team" && (
          <div className="text-center py-20 text-muted-foreground animate-in fade-in">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <h2 className="text-xl font-bold mb-2">Manajemen Anggota Tim</h2>
            <p>Fitur CRUD Anggota dan Upload Foto akan segera dibangun di sini.</p>
          </div>
        )}

      </div>
    </div>
  );
}