"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Package, MapPin, History, LayoutDashboard, Utensils, Users, BarChart3, Activity, Download, FileText, FileSpreadsheet, File } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";

// Impor Library Export Dokumen
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"orders" | "menu" | "team" | "analytics" | "logs">("orders");
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchOrders();
    fetchProducts();
    fetchLogs();

    const channel = supabase.channel("admin-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchOrders())
      .on("postgres_changes", { event: "*", schema: "public", table: "activity_logs" }, () => fetchLogs())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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

  const fetchLogs = async () => {
    const { data } = await supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(50);
    if (data) setLogs(data);
  };

  const insertLog = async (type: string, desc: string) => {
    await supabase.from("activity_logs").insert({ action_type: type, description: desc });
  };

  const handleCompleteOrder = async (orderId: string, userName: string) => {
    const { error } = await supabase.from("orders").update({ status: "success" }).eq("id", orderId);
    if (!error) {
      toast.success("Pesanan dipindahkan ke Riwayat.");
      insertLog("PESANAN_SELESAI", `Menyelesaikan pesanan atas nama pembeli: ${userName}`);
    }
  };

  const updateProductPrice = async (id: string, name: string, newPrice: number) => {
    const { error } = await supabase.from("products").update({ price: newPrice }).eq("id", id);
    if (!error) {
      toast.success("Harga diupdate!");
      insertLog("UPDATE_MENU", `Mengubah harga menu ${name} menjadi Rp ${newPrice.toLocaleString('id-ID')}`);
      fetchProducts();
    }
  };

  const activeOrders = orders.filter(o => o.status === "pending" || o.status === "paid");
  const historyOrders = orders.filter(o => o.status === "success");

  // --- LOGIKA ANALYTICS ---
  const rawDailyData: any = {};
  historyOrders.forEach(order => {
    const date = new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    rawDailyData[date] = (rawDailyData[date] || 0) + order.total_amount;
  });
  const dailyRevenueData = Object.keys(rawDailyData).map(date => ({ date, Pendapatan: rawDailyData[date] }));

  const rawItemData: any = {};
  historyOrders.forEach(order => {
    order.items_json.forEach((item: any) => {
      let qty = item.quantity;
      if (item.name.toLowerCase().includes("zensum") || item.name.toLowerCase().includes("dimsum")) {
        qty = qty * 3;
      }
      rawItemData[item.name] = (rawItemData[item.name] || 0) + qty;
    });
  });
  const itemSoldData = Object.keys(rawItemData).map(name => ({ name, Terjual: rawItemData[name] }));

  // --- FUNGSI EXPORT LAPORAN ---

  const exportExcel = () => {
    try {
      const dataToExport = historyOrders.map(o => ({
        "Waktu Transaksi": new Date(o.created_at).toLocaleString("id-ID"),
        "Nama Pemesan": o.user_name,
        "No. WhatsApp": o.customer_phone,
        "Jenis Pesanan": o.delivery_type.toUpperCase(),
        "Rincian Menu": o.items_json.map((i: any) => `${i.quantity}x ${i.name}`).join(", "),
        "Subtotal (Belanja)": o.subtotal_amount,
        "Biaya Ongkir": o.shipping_fee,
        "Grand Total": o.total_amount
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Penjualan F&B");
      XLSX.writeFile(workbook, "Laporan_Keuangan_CALOLESS.xlsx");

      insertLog("EXPORT_REPORT", "Mengunduh Laporan Keuangan (Format Excel)");
      toast.success("File Excel berhasil diunduh!");
    } catch (error) {
      toast.error("Gagal membuat file Excel.");
    }
  };

  const exportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Laporan Keuangan Restoran CALOLESS", 14, 20);
      doc.setFontSize(11);
      doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 28);

      const tableData = historyOrders.map(o => [
        new Date(o.created_at).toLocaleDateString("id-ID"),
        o.user_name,
        o.items_json.map((i: any) => `${i.quantity}x ${i.name}`).join("\n"),
        `Rp ${o.total_amount.toLocaleString('id-ID')}`
      ]);

      autoTable(doc, {
        startY: 35,
        head: [['Tanggal', 'Pemesan', 'Item Dibeli', 'Grand Total']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [139, 92, 246] } // Warna ungu primary CALOLESS
      });

      doc.save("Laporan_Keuangan_CALOLESS.pdf");
      insertLog("EXPORT_REPORT", "Mengunduh Laporan Keuangan (Format PDF)");
      toast.success("File PDF berhasil diunduh!");
    } catch (error) {
      toast.error("Gagal membuat file PDF.");
    }
  };

  const exportWord = async () => {
    try {
      const rows = historyOrders.map(o => new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(new Date(o.created_at).toLocaleDateString("id-ID"))] }),
          new TableCell({ children: [new Paragraph(o.user_name)] }),
          new TableCell({ children: [new Paragraph(`Rp ${o.total_amount.toLocaleString("id-ID")}`)] }),
        ]
      }));

      const table = new Table({
        rows: [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ text: "Tanggal", bold: true })] }),
              new TableCell({ children: [new Paragraph({ text: "Nama Pemesan", bold: true })] }),
              new TableCell({ children: [new Paragraph({ text: "Grand Total Pendapatan", bold: true })] }),
            ]
          }),
          ...rows
        ]
      });

      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({ text: "Laporan Pendapatan CALOLESS", heading: HeadingLevel.HEADING_1 }),
            new Paragraph({ text: `Dihasilkan pada sistem: ${new Date().toLocaleString('id-ID')}`, spacing: { after: 400 } }),
            table
          ]
        }]
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, "Laporan_Keuangan_CALOLESS.docx");
      insertLog("EXPORT_REPORT", "Mengunduh Laporan Keuangan (Format Word)");
      toast.success("File Word berhasil diunduh!");
    } catch (error) {
      toast.error("Gagal membuat file Word.");
    }
  };

  if (loading) return <div className="p-10 text-center flex flex-col items-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div><p className="mt-4">Memuat data server...</p></div>;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* SIDEBAR / TOPBAR NAVIGASI ADMIN */}
      <div className="bg-white dark:bg-zinc-900 border-b p-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-extrabold tracking-tight text-primary">CALOLESS <span className="text-zinc-500 font-medium">| Admin Center</span></h1>
          <div className="flex flex-wrap justify-center gap-2 bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-xl">
            <button onClick={() => setActiveTab("orders")} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === "orders" ? "bg-white dark:bg-zinc-700 shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}><LayoutDashboard className="w-4 h-4" /> Pesanan</button>
            <button onClick={() => setActiveTab("menu")} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === "menu" ? "bg-white dark:bg-zinc-700 shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}><Utensils className="w-4 h-4" /> Menu</button>
            <button onClick={() => setActiveTab("analytics")} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === "analytics" ? "bg-white dark:bg-zinc-700 shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}><BarChart3 className="w-4 h-4" /> Analytics</button>
            <button onClick={() => setActiveTab("logs")} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === "logs" ? "bg-white dark:bg-zinc-700 shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}><Activity className="w-4 h-4" /> Logs</button>
            <button onClick={() => setActiveTab("team")} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === "team" ? "bg-white dark:bg-zinc-700 shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}><Users className="w-4 h-4" /> Tim</button>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {/* ... TAB 1: PESANAN TETAP SAMA ... */}
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
                        <MapPin className="w-3.5 h-3.5 shrink-0" /> {order.address}
                      </p>
                    </div>
                    <div className="flex flex-col items-end justify-between gap-4">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Total Bayar</p>
                        <p className="text-xl font-black text-primary">Rp {order.total_amount?.toLocaleString("id-ID")}</p>
                      </div>
                      <Button onClick={() => handleCompleteOrder(order.id, order.user_name)} className="bg-green-600 hover:bg-green-700 text-white gap-2 rounded-full">
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

        {/* ... TAB 2: MENU TETAP SAMA ... */}
        {activeTab === "menu" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Katalog Produk</h2>
              <Button>+ Tambah Menu Baru</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {products.map((p) => (
                <div key={p.id} className="bg-white border rounded-2xl p-5 shadow-sm">
                  <h3 className="font-bold text-lg mb-2">{p.name}</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => updateProductPrice(p.id, p.name, p.price + 1000)}>Naik Harga</Button>
                    <Button variant="outline" size="sm" onClick={() => updateProductPrice(p.id, p.name, p.price - 1000)}>Turun Harga</Button>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">Harga Saat ini: <strong className="text-primary">Rp {p.price.toLocaleString()}</strong></p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: ANALYTICS DENGAN TOMBOL EXPORT */}
        {activeTab === "analytics" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-2xl font-bold">Analisa Performa Penjualan</h2>

              {/* TOMBOL-TOMBOL AJAIB EXPORT LAPORAN */}
              <div className="flex flex-wrap gap-2">
                <Button onClick={exportPDF} variant="outline" className="gap-2 border-red-200 text-red-600 hover:bg-red-50">
                  <FileText className="w-4 h-4" /> Export PDF
                </Button>
                <Button onClick={exportExcel} variant="outline" className="gap-2 border-green-200 text-green-600 hover:bg-green-50">
                  <FileSpreadsheet className="w-4 h-4" /> Export Excel
                </Button>
                <Button onClick={exportWord} variant="outline" className="gap-2 border-blue-200 text-blue-600 hover:bg-blue-50">
                  <File className="w-4 h-4" /> Export Word
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Grafik 1: Pendapatan */}
              <div className="bg-white dark:bg-zinc-900 border rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold mb-6 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> Tren Pendapatan Harian</h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyRevenueData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} width={80} tickFormatter={(value) => `Rp${value / 1000}k`} />
                      <Tooltip formatter={(value: any) => `Rp ${Number(value).toLocaleString("id-ID")}`} />
                      <Line type="monotone" dataKey="Pendapatan" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Grafik 2: Item Terjual */}
              <div className="bg-white dark:bg-zinc-900 border rounded-2xl p-6 shadow-sm">
                <div className="mb-6">
                  <h3 className="font-bold flex items-center gap-2"><Package className="w-5 h-5 text-orange-500" /> Popularitas Menu</h3>
                  <p className="text-xs text-muted-foreground mt-1">*Aturan khusus: 1 Porsi Zensum dihitung sebagai 3 Biji terjual.</p>
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={itemSoldData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="Terjual" fill="#f97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ... TAB 4: LOGS TETAP SAMA ... */}
        {activeTab === "logs" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2"><Activity className="w-6 h-6 text-primary" /> Riwayat Aktivitas Sistem</h2>
                <p className="text-sm text-muted-foreground mt-1">Pemantauan aksi admin secara real-time hingga tingkat detik.</p>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">🟢 Real-time Active</Badge>
            </div>

            <div className="bg-white dark:bg-zinc-900 border rounded-2xl shadow-sm overflow-hidden">
              <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-50 dark:bg-zinc-800 text-xs uppercase font-bold text-muted-foreground border-b sticky top-0">
                    <tr>
                      <th className="px-6 py-4">Waktu (Hari, Tgl, Jam, Menit, Detik)</th>
                      <th className="px-6 py-4">Aksi</th>
                      <th className="px-6 py-4">Deskripsi Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {logs.map((log) => {
                      const dateObj = new Date(log.created_at);
                      const fullTime = dateObj.toLocaleDateString('id-ID', {
                        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                      }) + " - " + dateObj.toLocaleTimeString('id-ID', {
                        hour: '2-digit', minute: '2-digit', second: '2-digit'
                      });

                      return (
                        <tr key={log.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-muted-foreground">{fullTime}</td>
                          <td className="px-6 py-4">
                            <Badge variant={log.action_type === "PESANAN_SELESAI" ? "default" : log.action_type.includes("EXPORT") ? "outline" : "secondary"} className="text-[10px]">
                              {log.action_type}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 font-medium">{log.description}</td>
                        </tr>
                      );
                    })}
                    {logs.length === 0 && <tr><td colSpan={3} className="text-center py-10 text-muted-foreground">Belum ada aktivitas tercatat.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: TIM */}
        {activeTab === "team" && (
          <div className="text-center py-20 text-muted-foreground animate-in fade-in">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <h2 className="text-xl font-bold mb-2">Manajemen Anggota Tim</h2>
            <p>Fitur CRUD Anggota dan Manajemen Stok akan kita kerjakan di Sprint 7.</p>
          </div>
        )}

      </div>
    </div>
  );
}