"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, Clock, Package, MapPin, History,
  LayoutDashboard, Utensils, Users, BarChart3,
  Activity, FileText, FileSpreadsheet, File,
  Trash2, Plus, UploadCloud, Edit3, X
} from "lucide-react";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LineChart, Line, CartesianGrid
} from "recharts";

// Library Export Dokumen
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

  // State Form Anggota & Mode Edit
  const [newMember, setNewMember] = useState({ name: "", role: "", photo_url: "", order_priority: 5 });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => fetchProducts())
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

  // --- LOGIKA MANAJEMEN PESANAN & STOK ---
  const handleCompleteOrder = async (orderId: string, userName: string, itemsJson: any[]) => {
    const { error: orderError } = await supabase.from("orders").update({ status: "success" }).eq("id", orderId);
    if (orderError) return toast.error("Gagal menyelesaikan pesanan.");

    for (const item of itemsJson) {
      const { data: currentProduct } = await supabase.from("products").select("stock").eq("id", item.id).single();
      if (currentProduct) {
        const newStock = Math.max(0, (currentProduct.stock || 0) - item.quantity);
        await supabase.from("products").update({ stock: newStock }).eq("id", item.id);
      }
    }

    toast.success("Pesanan selesai!");
    insertLog("PESANAN_SELESAI", `Pesanan ${userName} selesai.`);
  };

  const updateProductPrice = async (id: string, name: string, newPrice: number) => {
    const { error } = await supabase.from("products").update({ price: newPrice }).eq("id", id);
    if (!error) {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, price: newPrice } : p));
      toast.success("Harga diupdate!");
      insertLog("UPDATE_MENU", `Ubah harga ${name} jadi Rp ${newPrice.toLocaleString()}`);
    }
  };

  const updateProductStock = async (id: string, name: string, currentStock: number, change: number) => {
    const newStock = Math.max(0, currentStock + change);
    const { error } = await supabase.from("products").update({ stock: newStock }).eq("id", id);
    if (!error) {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: newStock } : p));
      toast.success("Stok disesuaikan!");
      insertLog("UPDATE_STOK", `Ubah stok ${name} jadi ${newStock}`);
    }
  };

  // --- LOGIKA MANAJEMEN TIM (CRUD LENGKAP) ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const toastId = toast.loading("Mengunggah foto...");
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('team-photos').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage.from('team-photos').getPublicUrl(filePath);
      setNewMember({ ...newMember, photo_url: publicUrlData.publicUrl });
      toast.success("Foto siap!", { id: toastId });
    } catch (error: any) {
      toast.error("Gagal upload: " + error.message, { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveMember = async () => {
    if (!newMember.name || !newMember.role) return toast.error("Nama & Role wajib diisi!");

    if (isEditing && editId) {
      const { error } = await supabase.from("team_members").update(newMember).eq("id", editId);
      if (!error) {
        toast.success("Identitas anggota berhasil diperbarui!");
        insertLog("UPDATE_ANGGOTA", `Update data anggota: ${newMember.name}`);
        resetForm();
      } else {
        toast.error("Gagal update data.");
      }
    } else {
      const { error } = await supabase.from("team_members").insert([newMember]);
      if (!error) {
        toast.success("Anggota baru ditambahkan!");
        insertLog("TAMBAH_ANGGOTA", `Tambah anggota: ${newMember.name}`);
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setNewMember({ name: "", role: "", photo_url: "", order_priority: 5 });
    setIsEditing(false);
    setEditId(null);
  };

  const startEdit = (member: any) => {
    setNewMember({
      name: member.name,
      role: member.role,
      photo_url: member.photo_url || "",
      order_priority: member.order_priority || 5
    });
    setEditId(member.id);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteMember = async (id: string, name: string) => {
    const { error } = await supabase.from("team_members").delete().eq("id", id);
    if (!error) {
      toast.success("Anggota dihapus.");
      insertLog("HAPUS_ANGGOTA", `Hapus anggota: ${name}`);
    }
  };

  // --- EXPORT & ANALYTICS ---
  const activeOrders = orders.filter(o => o.status === "pending" || o.status === "paid");
  const historyOrders = orders.filter(o => o.status === "success");

  const dailyRevenueData = Object.entries(
    historyOrders.reduce((acc: any, o) => {
      const date = new Date(o.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      acc[date] = (acc[date] || 0) + o.total_amount;
      return acc;
    }, {})
  ).map(([date, Pendapatan]) => ({ date, Pendapatan }));

  const itemSoldData = Object.entries(
    historyOrders.reduce((acc: any, order) => {
      order.items_json?.forEach((item: any) => {
        let qty = item.quantity;
        if (item.name.toLowerCase().includes("zensum")) qty *= 3;
        acc[item.name] = (acc[item.name] || 0) + qty;
      });
      return acc;
    }, {})
  ).map(([name, Terjual]) => ({ name, Terjual }));

  const exportExcel = () => {
    try {
      const data = historyOrders.map(o => ({
        "Waktu": o.created_at ? new Date(o.created_at).toLocaleString("id-ID") : "-",
        "Pemesan": o.user_name || "-",
        "WhatsApp": o.customer_phone || "-",
        "Tipe": o.delivery_type ? o.delivery_type.toUpperCase() : "-",
        "Total": o.total_amount || 0
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Laporan");
      XLSX.writeFile(wb, "Laporan_Caloless.xlsx");
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

  if (loading) return <div className="p-10 text-center font-bold">Sinkronisasi Data...</div>;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* NAVIGASI ADMIN */}
      <div className="bg-white dark:bg-zinc-900 border-b p-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-extrabold tracking-tight text-primary">CALOLESS <span className="text-zinc-500 font-medium">| Admin Center</span></h1>
          <div className="flex flex-wrap justify-center gap-2 bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-xl">
            <button onClick={() => setActiveTab("orders")} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === "orders" ? "bg-white text-primary shadow-sm" : "text-muted-foreground"}`}><LayoutDashboard className="w-4 h-4" /> Pesanan</button>
            <button onClick={() => setActiveTab("menu")} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === "menu" ? "bg-white text-primary shadow-sm" : "text-muted-foreground"}`}><Utensils className="w-4 h-4" /> Menu & Stok</button>
            <button onClick={() => setActiveTab("analytics")} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === "analytics" ? "bg-white text-primary shadow-sm" : "text-muted-foreground"}`}><BarChart3 className="w-4 h-4" /> Analytics</button>
            <button onClick={() => setActiveTab("logs")} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === "logs" ? "bg-white text-primary shadow-sm" : "text-muted-foreground"}`}><Activity className="w-4 h-4" /> Logs</button>
            <button onClick={() => setActiveTab("team")} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === "team" ? "bg-white text-primary shadow-sm" : "text-muted-foreground"}`}><Users className="w-4 h-4" /> Tim</button>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">

        {/* TAB 1: PESANAN */}
        {activeTab === "orders" && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
            {/* PESANAN AKTIF */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-orange-600 font-bold">
                <Clock className="w-5 h-5" /><h2>Pesanan Aktif ({activeOrders.length})</h2>
              </div>
              <div className="grid gap-4">
                {activeOrders.map((o) => (
                  <div key={o.id} className="bg-white dark:bg-zinc-900 border rounded-2xl p-5 shadow-sm flex flex-col md:flex-row justify-between gap-6">
                    <div className="space-y-2">
                      <div className="flex gap-2"><Badge variant={o.status === "paid" ? "default" : "outline"}>{o.status}</Badge></div>
                      <h3 className="font-bold text-lg">{o.user_name} <span className="text-sm font-normal text-muted-foreground">({o.customer_phone})</span></h3>
                      <div className="text-sm space-y-1">
                        {o.items_json?.map((i: any, idx: number) => (
                          <p key={idx} className="flex gap-2"><Package className="w-4 h-4 text-primary" /> {i.quantity}x {i.name}</p>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground flex gap-1"><MapPin className="w-3 h-3" /> {o.address}</p>
                    </div>
                    <div className="flex flex-col items-end justify-between gap-4">
                      <p className="text-xl font-black text-primary">Rp {o.total_amount?.toLocaleString("id-ID")}</p>
                      <Button onClick={() => handleCompleteOrder(o.id, o.user_name, o.items_json)} className="bg-green-600 hover:bg-green-700 text-white gap-2 rounded-full">
                        <CheckCircle2 className="w-4 h-4" /> Pesanan Selesai
                      </Button>
                    </div>
                  </div>
                ))}
                {activeOrders.length === 0 && <div className="text-center py-10 bg-white border rounded-xl text-muted-foreground">Belum ada pesanan masuk.</div>}
              </div>
            </section>

            {/* RIWAYAT PESANAN */}
            <section className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-zinc-500 font-bold">
                <History className="w-5 h-5" /><h2>Riwayat Pembelian</h2>
              </div>
              <div className="overflow-x-auto border rounded-2xl bg-white">
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-50 border-b">
                    <tr>
                      <th className="px-6 py-4">Pemesan</th>
                      <th className="px-6 py-4">Item & Qty</th>
                      <th className="px-6 py-4 text-right">Total Pendapatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {historyOrders.map((o) => (
                      <tr key={o.id}>
                        <td className="px-6 py-4">{o.user_name}</td>
                        <td className="px-6 py-4 text-xs">{o.items_json?.map((i: any) => `${i.quantity}x ${i.name}`).join(", ")}</td>
                        <td className="px-6 py-4 text-right font-bold text-primary">Rp {o.total_amount?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: MENU & STOK */}
        {activeTab === "menu" && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-2xl font-bold">Katalog Produk & Stok</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {products.map((p) => (
                <div key={p.id} className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="font-bold text-lg">{p.name}</h3>

                  {/* EDIT HARGA */}
                  <div className="bg-zinc-50 p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-1 text-center font-bold">Harga Jual</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary">Rp {p.price.toLocaleString()}</span>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => updateProductPrice(p.id, p.name, p.price - 1000)}>-1k</Button>
                        <Button variant="outline" size="sm" onClick={() => updateProductPrice(p.id, p.name, p.price + 1000)}>+1k</Button>
                      </div>
                    </div>
                  </div>

                  {/* EDIT STOK */}
                  <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                    <p className="text-xs text-orange-600 mb-1 text-center font-bold">Sisa Stok (Porsi)</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xl">{p.stock ?? 100}</span>
                      <div className="flex gap-1">
                        <Button variant="secondary" size="sm" onClick={() => updateProductStock(p.id, p.name, p.stock ?? 100, -1)}>-</Button>
                        <Button variant="secondary" size="sm" onClick={() => updateProductStock(p.id, p.name, p.stock ?? 100, 1)}>+</Button>
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: ANALYTICS & EXPORT */}
        {activeTab === "analytics" && (
          <div className="space-y-8 animate-in fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <h2 className="text-2xl font-bold">Analisa Performa</h2>
              {/* TOMBOL EXPORT LENGKAP */}
              <div className="flex gap-2">
                <Button onClick={exportPDF} variant="outline" className="gap-2 border-red-200 text-red-600 hover:bg-red-50"><FileText className="w-4 h-4" /> PDF</Button>
                <Button onClick={exportExcel} variant="outline" className="gap-2 border-green-200 text-green-600 hover:bg-green-50"><FileSpreadsheet className="w-4 h-4" /> Excel</Button>
                <Button onClick={exportWord} variant="outline" className="gap-2 border-blue-200 text-blue-600 hover:bg-blue-50"><File className="w-4 h-4" /> Word</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* GRAFIK 1: PENDAPATAN */}
              <div className="bg-white border rounded-2xl p-6 shadow-sm h-80">
                <h3 className="font-bold mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> Tren Pendapatan</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(val) => `${val / 1000}k`} />
                    <Tooltip formatter={(value: any) => `Rp ${Number(value).toLocaleString("id-ID")}`} />
                    <Line type="monotone" dataKey="Pendapatan" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* GRAFIK 2: ITEM TERJUAL */}
              <div className="bg-white border rounded-2xl p-6 shadow-sm h-80">
                <h3 className="font-bold mb-4 flex items-center gap-2"><Package className="w-5 h-5 text-orange-500" /> Item Terlaris (Biji)</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={itemSoldData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="Terjual" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: LOGS */}
        {activeTab === "logs" && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-2xl font-bold flex gap-2"><Activity className="text-primary" /> Audit Log Aktivitas</h2>
            <div className="bg-white border rounded-2xl shadow-sm overflow-hidden max-h-[600px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-50 sticky top-0 z-10 border-b">
                  <tr>
                    <th className="px-6 py-4">Waktu Detail</th>
                    <th className="px-6 py-4">Aksi</th>
                    <th className="px-6 py-4">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.map((l) => (
                    <tr key={l.id} className="hover:bg-zinc-50/50">
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString("id-ID")}</td>
                      <td className="px-6 py-4"><Badge variant="secondary">{l.action_type}</Badge></td>
                      <td className="px-6 py-4 font-medium">{l.description}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && <tr><td colSpan={3} className="text-center py-10">Belum ada log.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: TIM (CRUD LENGKAP: CREATE, READ, UPDATE, DELETE) */}
        {activeTab === "team" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-2xl font-bold flex gap-2"><Users className="text-primary" /> Anggota Kelompok 7</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* FORM DINAMIS (TAMBAH / EDIT) */}
              <div className="lg:col-span-1 bg-white border rounded-2xl p-6 shadow-sm h-fit space-y-4 border-primary/20 bg-primary/5">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-primary">{isEditing ? "Edit Profil Anggota" : "Daftarkan Anggota"}</h3>
                  {isEditing && <Button variant="ghost" size="icon" onClick={resetForm} className="h-6 w-6"><X className="w-4 h-4" /></Button>}
                </div>
                <input type="text" placeholder="Nama Lengkap" value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
                <input type="text" placeholder="Role (cth: Hacker)" value={newMember.role} onChange={(e) => setNewMember({ ...newMember, role: e.target.value })} className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
                <input type="number" placeholder="Urutan (1-10)" value={newMember.order_priority} onChange={(e) => setNewMember({ ...newMember, order_priority: parseInt(e.target.value) })} className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />

                <div className="space-y-2 pt-2 border-t">
                  <label className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 uppercase tracking-wider"><UploadCloud className="w-3.5 h-3.5" /> Ganti Foto Profil</label>
                  <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} className="w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-primary/20 file:text-primary cursor-pointer" />
                  {newMember.photo_url && (
                    <div className="relative w-16 h-16 rounded-full border-2 border-primary/30 overflow-hidden mt-2">
                      <Image src={newMember.photo_url} alt="Preview" fill className="object-cover" />
                    </div>
                  )}
                </div>

                <Button onClick={handleSaveMember} disabled={isUploading} className="w-full font-bold shadow-md">
                  {isEditing ? <><Edit3 className="w-4 h-4 mr-2" /> Perbarui Identitas</> : <><Plus className="w-4 h-4 mr-2" /> Simpan Anggota</>}
                </Button>
              </div>

              {/* LIST ANGGOTA DENGAN TOMBOL EDIT & DELETE */}
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {team.map((member) => (
                  <div key={member.id} className={`bg-white border rounded-2xl p-4 shadow-sm flex items-center justify-between group transition-all ${editId === member.id ? 'border-primary ring-2 ring-primary/20' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-zinc-100">
                        <Image src={member.photo_url || "/team-1.png"} alt={member.name} fill className="object-cover" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm leading-tight">{member.name}</h4>
                        <p className="text-[10px] text-primary font-black uppercase">{member.role}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:bg-blue-50" onClick={() => startEdit(member)}>
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleDeleteMember(member.id, member.name)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}