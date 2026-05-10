"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Package, Phone, MapPin, History } from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Fetch Pesanan secara Real-time
  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();

    // Setup Realtime Subscription
    const channel = supabase
      .channel("realtime-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleCompleteOrder = async (orderId: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: "success" }) // Mengubah status menjadi sukses/selesai
      .eq("id", orderId);

    if (error) {
      toast.error("Gagal memperbarui status.");
    } else {
      toast.success("Pesanan dipindahkan ke Riwayat Pembelian.");
    }
  };

  const activeOrders = orders.filter(o => o.status === "pending" || o.status === "paid");
  const historyOrders = orders.filter(o => o.status === "success");

  if (loading) return <div className="p-10 text-center">Memuat data pesanan...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Dashboard Admin CALOLESS</h1>
          <p className="text-muted-foreground">Pantau pesanan masuk secara real-time.</p>
        </div>
      </header>

      {/* TABEL 1: PESANAN MASUK (AKTIF) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-orange-600 font-bold">
          <Clock className="w-5 h-5" />
          <h2>Pesanan Aktif ({activeOrders.length})</h2>
        </div>
        <div className="grid gap-4">
          {activeOrders.map((order) => (
            <div key={order.id} className="bg-white dark:bg-zinc-900 border rounded-2xl p-5 shadow-sm flex flex-col md:flex-row justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge variant={order.status === "paid" ? "default" : "outline"} className="capitalize">
                    {order.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString("id-ID")}</span>
                </div>
                <h3 className="text-lg font-bold">{order.user_name} <span className="text-sm font-normal text-muted-foreground">({order.customer_phone})</span></h3>
                <div className="text-sm space-y-1">
                  {order.items_json.map((item: any, i: number) => (
                    <p key={i} className="flex gap-2">
                      <Package className="w-4 h-4 text-primary" /> {item.quantity}x {item.name}
                    </p>
                  ))}
                </div>
                <p className="text-xs flex items-center gap-1 text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" /> {order.address}
                </p>
              </div>
              <div className="flex flex-col items-end justify-between gap-4">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total Bayar</p>
                  <p className="text-xl font-black text-primary">Rp {order.total_amount.toLocaleString("id-ID")}</p>
                </div>
                <Button
                  onClick={() => handleCompleteOrder(order.id)}
                  className="bg-green-600 hover:bg-green-700 text-white gap-2 rounded-full"
                >
                  <CheckCircle2 className="w-4 h-4" /> Pesanan Sudah Selesai
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TABEL 2: RIWAYAT PEMBELIAN (Poin 4) */}
      <section className="space-y-4 pt-10">
        <div className="flex items-center gap-2 text-zinc-500 font-bold">
          <History className="w-5 h-5" />
          <h2>Riwayat Pembelian</h2>
        </div>
        <div className="overflow-x-auto border rounded-2xl bg-white dark:bg-zinc-900">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-800 text-xs uppercase font-bold text-muted-foreground border-b">
              <tr>
                <th className="px-6 py-4">Pemesan</th>
                <th className="px-6 py-4">Item & Qty</th>
                <th className="px-6 py-4">Total Qty</th>
                <th className="px-6 py-4 text-right">Belanja</th>
                <th className="px-6 py-4 text-right">Ongkir</th>
                <th className="px-6 py-4 text-right">Grand Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {historyOrders.map((order) => {
                const totalQty = order.items_json.reduce((acc: number, curr: any) => acc + curr.quantity, 0);
                return (
                  <tr key={order.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium">{order.user_name}</td>
                    <td className="px-6 py-4 text-xs">
                      {order.items_json.map((item: any) => `${item.name} (${item.quantity})`).join(", ")}
                    </td>
                    <td className="px-6 py-4 text-center font-bold">{totalQty}</td>
                    <td className="px-6 py-4 text-right italic">Rp {order.subtotal_amount?.toLocaleString("id-ID")}</td>
                    <td className="px-6 py-4 text-right text-orange-600 font-medium">Rp {order.shipping_fee?.toLocaleString("id-ID")}</td>
                    <td className="px-6 py-4 text-right font-black text-primary">Rp {order.total_amount.toLocaleString("id-ID")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}