"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Package, MapPin, History, LayoutDashboard, Utensils, Users, BarChart3, Activity, FileText, FileSpreadsheet, File, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import Image from "next/image";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"orders" | "menu" | "team" | "analytics" | "logs">("orders");
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // SESUAIKAN DENGAN SKEMA DATABASE ASLI (Ada photo_url & order_priority)
  const [newMember, setNewMember] = useState({ name: "", role: "", photo_url: "", order_priority: 5 });

  const supabase = createClient();

  useEffect(() => {
    fetchOrders();
    fetchProducts();
    fetchLogs();
    fetchTeam();

    const channel = supabase.channel("admin-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchOrders())
      .on("postgres_changes", { event: "*", schema: "public", table: "activity_logs" }, () => fetchLogs())
      .on("postgres_changes", { event: "*", schema: "public", table: "team_members" }, () => fetchTeam())
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

  const fetchTeam = async () => {
    const { data } = await supabase.from("team_members").select("*").order("order_priority", { ascending: true });
    if (data) setTeam(data);
  };

  const insertLog = async (type: string, desc: string) => {
    await supabase.from("activity_logs").insert({ action_type: type, description: desc });
  };

  const handleCompleteOrder = async (orderId: string, userName: string) => {
    const { error } = await supabase.from("orders").update({ status: "success" }).eq("id", orderId);
    if (!error) {
      toast.success("Pesanan dipindahkan ke Riwayat.");
      insertLog("PESANAN_SELESAI", `Menyelesaikan pesanan atas nama: ${userName}`);
    }
  };

  // Perbaikan fungsi Update Harga
  const updateProductPrice = async (id: string, name: string, newPrice: number) => {
    const { error } = await supabase.from("products").update({ price: newPrice }).eq("id", id);

    if (error) {
      toast.error("Gagal update harga: " + error.message);
    } else {
      // Langsung update state lokal agar angka di layar berubah seketika
      setProducts(prev => prev.map(p => p.id === id ? { ...p, price: newPrice } : p));
      toast.success("Harga diupdate!");
      insertLog("UPDATE_MENU", `Ubah harga menu ${name} menjadi Rp ${newPrice.toLocaleString('id-ID')}`);
    }
  };

  // Perbaikan fungsi Update Stok
  const updateProductStock = async (id: string, name: string, currentStock: number, change: number) => {
    const newStock = Math.max(0, currentStock + change);
    const { error } = await supabase.from("products").update({ stock: newStock }).eq("id", id);

    if (error) {
      toast.error("Gagal update stok: " + error.message);
    } else {
      // Langsung update state lokal agar angka di layar berubah seketika
      setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: newStock } : p));
      toast.success("Stok disesuaikan!");
      insertLog("UPDATE_STOK", `Ubah stok ${name} menjadi ${newStock} porsi`);
    }
  };

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.role) return toast.error("Nama dan Role wajib diisi!");
    const { error } = await supabase.from("team_members").insert([newMember]);
    if (!error) {
      toast.success("Anggota tim berhasil ditambahkan!");
      insertLog("TAMBAH_ANGGOTA", `Menambahkan ${newMember.name} sebagai ${newMember.role}`);
      setNewMember({ name: "", role: "", photo_url: "", order_priority: 5 });
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    const { error } = await supabase.from("team_members").delete().eq("id", id);
    if (!error) {
      toast.success("Anggota dihapus.");
      insertLog("HAPUS_ANGGOTA", `Menghapus anggota tim: ${name}`);
    }
  };

  const activeOrders = orders.filter(o => o.status === "pending" || o.status === "paid");
  const historyOrders = orders.filter(o => o.status === "success");

  const rawDailyData: any = {};
  historyOrders.forEach(o => {
    const date = new Date(o.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    rawDailyData[date] = (rawDailyData[date] || 0) + o.total_amount;
  });
  const dailyRevenueData = Object.keys(rawDailyData).map(date => ({ date, Pendapatan: rawDailyData[date] }));

  const rawItemData: any = {};
  historyOrders.forEach(order => {
    order.items_json.forEach((item: any) => {
      let qty = item.quantity;
      if (item.name.toLowerCase().includes("zensum")) qty = qty * 3;
      rawItemData[item.name] = (rawItemData[item.name] || 0) + qty;
    });
  });
  const itemSoldData = Object.keys(rawItemData).map(name => ({ name, Terjual: rawItemData[name] }));

  const exportExcel = () => {
    try {
      const dataToExport = historyOrders.map(o => ({
        "Waktu Transaksi": o.created_at ? new Date(o.created_at).toLocaleString("id-ID") : "-",
        "Nama Pemesan": o.user_name || "-",
        "No. WhatsApp": o.customer_phone || "-",
        "Jenis Pesanan": o.delivery_type ? o.delivery_type.toUpperCase() : "-",
        "Rincian Menu": o.items_json ? o.items_json.map((i: any) => `${i.quantity}x ${i.name}`).join(", ") : "-",
        "Subtotal (Belanja)": o.subtotal_amount || 0,
        "Biaya Ongkir": o.shipping_fee || 0,
        "Grand Total": o.total_amount || 0
      }));
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Penjualan");
      XLSX.writeFile(workbook, "Laporan_Keuangan_CALOLESS.xlsx");
      insertLog("EXPORT_REPORT", "Mengunduh Laporan Keuangan (Excel)");
    } catch (e) { toast.error("Gagal Excel"); }
  };

  const exportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18); doc.text("Laporan Keuangan CALOLESS", 14, 20);
      autoTable(doc, {
        startY: 30,
        head: [['Tanggal', 'Pemesan', 'Total']],
        body: historyOrders.map(o => [new Date(o.created_at).toLocaleDateString("id-ID"), o.user_name, `Rp ${o.total_amount}`]),
      });
      doc.save("Laporan_CALOLESS.pdf");
      insertLog("EXPORT_REPORT", "Unduh Laporan (PDF)");
    } catch (e) { }
  };

  const exportWord = async () => {
    try {
      const rows = historyOrders.map(o => new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(new Date(o.created_at).toLocaleDateString("id-ID"))] }),
          new TableCell({ children: [new Paragraph(o.user_name)] }),
          new TableCell({ children: [new Paragraph(`Rp ${o.total_amount}`)] })
        ]
      }));
      const table = new Table({
        rows: [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Tanggal", bold: true })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Pemesan", bold: true })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Total", bold: true })] })] })
            ]
          }), ...rows
        ]
      });
      const doc = new Document({ sections: [{ children: [new Paragraph({ text: "Laporan CALOLESS", heading: HeadingLevel.HEADING_1 }), table] }] });
      const blob = await Packer.toBlob(doc); saveAs(blob, "Laporan_CALOLESS.docx");
      insertLog("EXPORT_REPORT", "Unduh Laporan (Word)");
    } catch (e) { }
  };

  if (loading) return <div className="p-10 text-center">Memuat data...</div>;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="bg-white dark:bg-zinc-900 border-b p-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-extrabold tracking-tight text-primary">CALOLESS <span className="text-zinc-500 font-medium">| Admin Center</span></h1>
          <div className="flex flex-wrap justify-center gap-2 bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-xl overflow-x-auto">
            <button onClick={() => setActiveTab("orders")} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === "orders" ? "bg-white text-primary shadow-sm" : "text-muted-foreground"}`}><LayoutDashboard className="w-4 h-4" /> Pesanan</button>
            <button onClick={() => setActiveTab("menu")} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === "menu" ? "bg-white text-primary shadow-sm" : "text-muted-foreground"}`}><Utensils className="w-4 h-4" /> Menu & Stok</button>
            <button onClick={() => setActiveTab("analytics")} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === "analytics" ? "bg-white text-primary shadow-sm" : "text-muted-foreground"}`}><BarChart3 className="w-4 h-4" /> Analytics</button>
            <button onClick={() => setActiveTab("logs")} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === "logs" ? "bg-white text-primary shadow-sm" : "text-muted-foreground"}`}><Activity className="w-4 h-4" /> Logs</button>
            <button onClick={() => setActiveTab("team")} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === "team" ? "bg-white text-primary shadow-sm" : "text-muted-foreground"}`}><Users className="w-4 h-4" /> Tim</button>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {activeTab === "orders" && (
          <div className="space-y-10 animate-in fade-in">
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-orange-600 font-bold"><Clock className="w-5 h-5" /><h2>Pesanan Aktif ({activeOrders.length})</h2></div>
              <div className="grid gap-4">
                {activeOrders.map((o) => (
                  <div key={o.id} className="bg-white border rounded-2xl p-5 shadow-sm flex flex-col md:flex-row justify-between gap-6">
                    <div className="space-y-2">
                      <h3 className="font-bold text-lg">{o.user_name} <span className="text-sm font-normal text-muted-foreground">({o.customer_phone})</span></h3>
                      <div className="text-sm space-y-1">{o.items_json.map((i: any, idx: number) => (<p key={idx} className="flex gap-2"><Package className="w-4 h-4 text-primary" /> {i.quantity}x {i.name}</p>))}</div>
                    </div>
                    <div className="flex flex-col items-end gap-4">
                      <p className="text-xl font-black text-primary">Rp {o.total_amount?.toLocaleString("id-ID")}</p>
                      <Button onClick={() => handleCompleteOrder(o.id, o.user_name)} className="bg-green-600 hover:bg-green-700 text-white gap-2"><CheckCircle2 className="w-4 h-4" /> Pesanan Selesai</Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section className="space-y-4 pt-4">
              <div className="flex items-center gap-2 text-zinc-500 font-bold"><History className="w-5 h-5" /><h2>Riwayat Pembelian</h2></div>
              <div className="overflow-x-auto border rounded-2xl bg-white"><table className="w-full text-sm text-left"><thead className="bg-zinc-50 text-xs uppercase text-muted-foreground"><tr><th className="px-6 py-4">Pemesan</th><th className="px-6 py-4">Total</th></tr></thead><tbody>{historyOrders.map((o) => (<tr key={o.id} className="border-t"><td className="px-6 py-4">{o.user_name}</td><td className="px-6 py-4 font-bold text-primary">Rp {o.total_amount?.toLocaleString()}</td></tr>))}</tbody></table></div>
            </section>
          </div>
        )}

        {activeTab === "menu" && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center"><h2 className="text-2xl font-bold">Katalog Produk & Manajemen Stok</h2></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {products.map((p) => (
                <div key={p.id} className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="font-bold text-lg">{p.name}</h3>
                  <div className="bg-zinc-50 p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-2">Harga Jual</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary">Rp {p.price.toLocaleString()}</span>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => updateProductPrice(p.id, p.name, p.price - 1000)}>-1k</Button>
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => updateProductPrice(p.id, p.name, p.price + 1000)}>+1k</Button>
                      </div>
                    </div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                    <p className="text-xs text-orange-600 mb-2 font-semibold">Sisa Stok (Porsi)</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xl">{p.stock ?? 100}</span>
                      <div className="flex gap-1">
                        <Button variant="secondary" size="sm" className="h-7 w-7 p-0" onClick={() => updateProductStock(p.id, p.name, p.stock ?? 100, -1)}>-</Button>
                        <Button variant="secondary" size="sm" className="h-7 w-7 p-0" onClick={() => updateProductStock(p.id, p.name, p.stock ?? 100, 1)}>+</Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-8 animate-in fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-2xl font-bold">Analisa Performa</h2>
              <div className="flex gap-2">
                <Button onClick={exportPDF} variant="outline" className="gap-2 border-red-200 text-red-600"><FileText className="w-4 h-4" /> PDF</Button>
                <Button onClick={exportExcel} variant="outline" className="gap-2 border-green-200 text-green-600"><FileSpreadsheet className="w-4 h-4" /> Excel</Button>
                <Button onClick={exportWord} variant="outline" className="gap-2 border-blue-200 text-blue-600"><File className="w-4 h-4" /> Word</Button>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white border rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold mb-6 flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Pendapatan</h3>
                <div className="h-72 w-full"><ResponsiveContainer><LineChart data={dailyRevenueData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" /><YAxis /><Tooltip /><Line type="monotone" dataKey="Pendapatan" stroke="#8b5cf6" strokeWidth={3} /></LineChart></ResponsiveContainer></div>
              </div>
              <div className="bg-white border rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold mb-6 flex items-center gap-2"><Package className="w-5 h-5" /> Menu Terjual</h3>
                <div className="h-72 w-full"><ResponsiveContainer><BarChart data={itemSoldData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="Terjual" fill="#f97316" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between"><h2 className="text-2xl font-bold flex gap-2"><Activity /> Riwayat Aktivitas Sistem</h2></div>
            <div className="bg-white border rounded-2xl shadow-sm overflow-hidden max-h-[600px] overflow-y-auto">
              <table className="w-full text-sm text-left"><thead className="bg-zinc-50 border-b sticky top-0"><tr><th className="px-6 py-4">Waktu</th><th className="px-6 py-4">Aksi</th><th className="px-6 py-4">Deskripsi</th></tr></thead><tbody className="divide-y">{logs.map((l) => (<tr key={l.id}><td className="px-6 py-4 font-mono text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString("id-ID")}</td><td className="px-6 py-4"><Badge variant="secondary" className="text-[10px]">{l.action_type}</Badge></td><td className="px-6 py-4">{l.description}</td></tr>))}</tbody></table>
            </div>
          </div>
        )}

        {/* TAB 5: TIM (SUDAH DISESUAIKAN DENGAN SKEMA ASLI) */}
        {activeTab === "team" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6 text-primary" /> Manajemen Anggota Tim</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* FORM TAMBAH ANGGOTA */}
              <div className="lg:col-span-1 bg-white dark:bg-zinc-900 border rounded-2xl p-6 shadow-sm h-fit">
                <h3 className="font-bold mb-4">Tambah Anggota Baru</h3>
                <div className="space-y-4">
                  <input type="text" placeholder="Nama Lengkap" value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} className="flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
                  <input type="text" placeholder="Role (cth: Hacker, Hustler)" value={newMember.role} onChange={(e) => setNewMember({ ...newMember, role: e.target.value })} className="flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
                  <input type="text" placeholder="URL Foto (/team-1.png)" value={newMember.photo_url} onChange={(e) => setNewMember({ ...newMember, photo_url: e.target.value })} className="flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
                  <input type="number" placeholder="Urutan (cth: 1)" value={newMember.order_priority} onChange={(e) => setNewMember({ ...newMember, order_priority: parseInt(e.target.value) })} className="flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
                  <Button onClick={handleAddMember} className="w-full gap-2 font-bold"><Plus className="w-4 h-4" /> Daftarkan Anggota</Button>
                </div>
              </div>

              {/* DAFTAR ANGGOTA (DENGAN FOTO ASLI) */}
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {team.map((member) => (
                  <div key={member.id} className="bg-white dark:bg-zinc-900 border rounded-2xl p-5 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* FOTO PROFIL */}
                      <div className="relative w-12 h-12 rounded-full overflow-hidden border">
                        <Image src={member.photo_url || "/team-1.png"} alt={member.name} fill className="object-cover" sizes="48px" />
                      </div>
                      <div>
                        <h4 className="font-bold leading-tight">{member.name}</h4>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => handleDeleteMember(member.id, member.name)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {team.length === 0 && <div className="col-span-full text-center py-10 text-muted-foreground border border-dashed rounded-xl">Belum ada anggota tim terdaftar.</div>}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}