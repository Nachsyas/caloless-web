"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, Clock, Package, MapPin, History,
  LayoutDashboard, Utensils, Users, BarChart3,
  Activity, FileText, FileSpreadsheet, File,
  Trash2, Plus, UploadCloud, Edit3, X, Database, Image as ImageIcon,
  Info, UtensilsCrossed, XCircle, Calculator
} from "lucide-react";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LineChart, Line, CartesianGrid
} from "recharts";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel } from 'docx';
import Image from "next/image";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"orders" | "menu" | "team" | "analytics" | "logs">("orders");
  const [menuSubTab, setMenuSubTab] = useState<"catalog" | "ingredients">("catalog");

  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // States CRUD Team
  const [newMember, setNewMember] = useState({ name: "", role: "", photo_url: "", order_priority: 5 });
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [editTeamId, setEditTeamId] = useState<string | null>(null);
  const [isUploadingTeam, setIsUploadingTeam] = useState(false);

  // States CRUD Menu
  const [newProduct, setNewProduct] = useState({
    name: "", price: 0, stock: 0, description: "",
    portion_size: "", ingredients_text: "", image_url: ""
  });
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [isUploadingProduct, setIsUploadingProduct] = useState(false);

  // States CRUD Ingredients (Gudang)
  const [newIng, setNewIng] = useState({ name: "", unit: "", stock_quantity: 0, calories_per_unit: 0 });
  const [isEditingIng, setIsEditingIng] = useState(false);
  const [editIngId, setEditIngId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchData();
    const channel = supabase.channel("erp-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "ingredients" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "team_members" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "activity_logs" }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
    const { data: p } = await supabase.from("products").select("*, product_ingredients(*, ingredients(*))").order("name");
    const { data: i } = await supabase.from("ingredients").select("*").order("name");
    const { data: o } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    const { data: t } = await supabase.from("team_members").select("*").order("order_priority");
    const { data: l } = await supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(50);

    if (p) setProducts(p);
    if (i) setIngredients(i);
    if (o) setOrders(o);
    if (t) setTeam(t);
    if (l) setLogs(l);
    setLoading(false);
  };

  const insertLog = async (type: string, desc: string) => {
    await supabase.from("activity_logs").insert({ action_type: type, description: desc });
  };

  const calculateAutoTotal = (recipe: any[]) => {
    if (!recipe || recipe.length === 0) return 0;
    return recipe.reduce((sum, item) => sum + (item.amount_needed * (item.ingredients?.calories_per_unit || 0)), 0).toFixed(0);
  };

  // --- ORDER LOGIC ---
  const handleCompleteOrder = async (orderId: string, userName: string, items: any[]) => {
    const { error } = await supabase.from("orders").update({ status: "success" }).eq("id", orderId);
    if (error) return toast.error("Gagal update pesanan.");

    for (const item of items) {
      const { data: p } = await supabase.from("products").select("stock").eq("id", item.id).single();
      if (p) {
        await supabase.from("products").update({ stock: Math.max(0, (p.stock || 0) - item.quantity) }).eq("id", item.id);
      }

      const { data: recipe } = await supabase.from("product_ingredients").select("*").eq("product_id", item.id);
      if (recipe) {
        for (const r of recipe) {
          const { data: ing } = await supabase.from("ingredients").select("stock_quantity").eq("id", r.ingredient_id).single();
          if (ing) {
            const totalUsed = r.amount_needed * item.quantity;
            await supabase.from("ingredients").update({
              stock_quantity: Math.max(0, ing.stock_quantity - totalUsed)
            }).eq("id", r.ingredient_id);
          }
        }
      }
    }
    toast.success("Pesanan Selesai!");
    insertLog("ORDER_SUCCESS", `Pesanan ${userName} telah diselesaikan.`);
  };

  const handleShipOrder = async (orderId: string, userName: string) => {
    const { error } = await supabase.from("orders").update({ status: "dikirim" }).eq("id", orderId);
    if (!error) {
      toast.success("Status berubah: Pesanan sedang dalam perjalanan!");
      insertLog("ORDER_SHIPPED", `Pesanan ${userName} sedang diantar kurir.`);
      fetchData(); // Refresh UI
    }
  };

  const handleCancelOrder = async (orderId: string, userName: string) => {
    if (!confirm("Batalkan pesanan ini?")) return;
    await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);
    toast.success("Pesanan dibatalkan.");
    insertLog("ORDER_CANCEL", `Membatalkan pesanan ${userName}.`);
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
      case 'success':
        return <Badge className="bg-green-500 hover:bg-green-600 text-white border-0 shadow-sm px-3 py-1 text-xs">Pembayaran ✅</Badge>;
      case 'dikirim':
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-0 shadow-sm px-3 py-1 text-xs">Sedang Dikirim 🛵</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-orange-400 text-orange-600 bg-orange-50 shadow-sm px-3 py-1 text-xs">Menunggu Pembayaran ⏳</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="shadow-sm px-3 py-1 text-xs">Pesanan Dibatalkan ❌</Badge>;
      default:
        return <Badge variant="secondary" className="uppercase px-3 py-1 text-xs">{status}</Badge>;
    }
  };

  // --- MENU LOGIC ---
  const handleProductUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingProduct(true);
    const fileName = `${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("product-photos").upload(`menus/${fileName}`, file);
    if (!error) {
      const { data } = supabase.storage.from("product-photos").getPublicUrl(`menus/${fileName}`);
      setNewProduct({ ...newProduct, image_url: data.publicUrl });
      toast.success("Foto diunggah!");
    }
    setIsUploadingProduct(false);
  };

  const handleSaveProduct = async () => {
    if (!newProduct.name || newProduct.price <= 0) return toast.error("Nama & Harga valid wajib diisi!");
    if (isEditingProduct && editProductId) {
      await supabase.from("products").update(newProduct).eq("id", editProductId);
      toast.success("Menu diupdate!");
      insertLog("UPDATE_MENU", `Mengubah data menu ${newProduct.name}`);
    } else {
      await supabase.from("products").insert([newProduct]);
      toast.success("Menu baru ditambah!");
      insertLog("TAMBAH_MENU", `Menambah menu baru ${newProduct.name}`);
    }
    resetProductForm();
  };

  const resetProductForm = () => {
    setNewProduct({ name: "", price: 0, stock: 0, description: "", portion_size: "", ingredients_text: "", image_url: "" });
    setIsEditingProduct(false);
    setEditProductId(null);
  };

  const startEditProduct = (p: any) => {
    setNewProduct({
      name: p.name, price: p.price, stock: p.stock || 0, description: p.description || "",
      portion_size: p.portion_size || "", ingredients_text: p.ingredients_text || "",
      image_url: p.image_url || ""
    });
    setIsEditingProduct(true);
    setEditProductId(p.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Hapus menu ${name}?`)) return;
    await supabase.from("products").delete().eq("id", id);
    toast.success("Menu dihapus."); insertLog("HAPUS_MENU", `Hapus menu: ${name}`);
  };

  const updateProductStockOnly = async (id: string, name: string, curr: number, change: number) => {
    const newStock = Math.max(0, curr + change);
    await supabase.from("products").update({ stock: newStock }).eq("id", id);
    insertLog("UPDATE_STOK", `Stok ${name} jadi ${newStock}`);
  };

  // --- INGREDIENT LOGIC ---
  const handleSaveIngredient = async () => {
    if (!newIng.name || !newIng.unit) return toast.error("Nama & Satuan wajib diisi!");

    if (isEditingIng && editIngId) {
      await supabase.from("ingredients").update(newIng).eq("id", editIngId);
      toast.success("Inventaris diperbarui!");
      insertLog("UPDATE_GUDANG", `Update bahan baku ${newIng.name}`);
    } else {
      await supabase.from("ingredients").insert([newIng]);
      toast.success("Bahan baku masuk gudang!");
      insertLog("TAMBAH_GUDANG", `Menambah bahan baku ${newIng.name}`);
    }
    resetIngForm();
    fetchData(); // Refresh UI instantly
  };

  const resetIngForm = () => {
    setNewIng({ name: "", unit: "", stock_quantity: 0, calories_per_unit: 0 });
    setIsEditingIng(false);
    setEditIngId(null);
  };

  const startEditIng = (ing: any) => {
    setNewIng({
      name: ing.name, unit: ing.unit, stock_quantity: ing.stock_quantity, calories_per_unit: ing.calories_per_unit
    });
    setIsEditingIng(true);
    setEditIngId(ing.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteIngredient = async (id: string, name: string) => {
    if (!confirm(`Hapus bahan baku ${name} dari gudang?`)) return;
    await supabase.from("ingredients").delete().eq("id", id);
    toast.success("Bahan baku dihapus.");
    insertLog("HAPUS_GUDANG", `Hapus bahan baku ${name}`);
    fetchData();
  };


  // --- TEAM LOGIC ---
  const handleTeamUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingTeam(true);
    const fileName = `${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("team-photos").upload(`profiles/${fileName}`, file);
    if (!error) {
      const { data } = supabase.storage.from("team-photos").getPublicUrl(`profiles/${fileName}`);
      setNewMember({ ...newMember, photo_url: data.publicUrl });
      toast.success("Foto tim diunggah!");
    }
    setIsUploadingTeam(false);
  };

  const handleSaveTeam = async () => {
    if (!newMember.name || !newMember.role) return toast.error("Nama & Role wajib!");
    if (isEditingTeam && editTeamId) {
      await supabase.from("team_members").update(newMember).eq("id", editTeamId);
      toast.success("Anggota diupdate!");
    } else {
      await supabase.from("team_members").insert([newMember]);
      toast.success("Anggota baru ditambah!");
    }
    setNewMember({ name: "", role: "", photo_url: "", order_priority: 5 });
    setIsEditingTeam(false);
    setEditTeamId(null);
  };

  const resetTeamForm = () => { setNewMember({ name: "", role: "", photo_url: "", order_priority: 5 }); setIsEditingTeam(false); setEditTeamId(null); };
  const startEditTeam = (m: any) => { setNewMember({ name: m.name, role: m.role, photo_url: m.photo_url || "", order_priority: m.order_priority || 5 }); setEditTeamId(m.id); setIsEditingTeam(true); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleDeleteTeam = async (id: string, name: string) => { await supabase.from("team_members").delete().eq("id", id); toast.success("Dihapus."); };

  // --- ANALYTICS & EXPORT LOGIC ---
  const activeOrders = orders.filter(o => o.status === "pending" || o.status === "paid" || o.status === "dikirim");
  const historyOrders = orders.filter(o => o.status === "success" || o.status === "cancelled");

  const dailyRevenueData = Object.entries(
    historyOrders.filter(o => o.status === "success").reduce((acc: any, o) => {
      const date = new Date(o.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      acc[date] = (acc[date] || 0) + o.total_amount;
      return acc;
    }, {})
  ).map(([date, Pendapatan]) => ({ date, Pendapatan }));

  const itemSoldData = Object.entries(
    historyOrders.filter(o => o.status === "success").reduce((acc: any, order) => {
      order.items_json?.forEach((i: any) => {
        let qty = i.quantity;
        if (i.name.toLowerCase().includes("zensum")) qty *= 3;
        acc[i.name] = (acc[i.name] || 0) + qty;
      });
      return acc;
    }, {})
  ).map(([name, Terjual]) => ({ name, Terjual }));

  const exportExcel = () => {
    try {
      if (historyOrders.length === 0) return toast.error("Tidak ada data untuk di-export.");
      const data = historyOrders.map(o => ({
        "Waktu Transaksi": new Date(o.created_at).toLocaleString("id-ID"),
        "Status": o.status.toUpperCase(),
        "Nama Pemesan": o.user_name || "-",
        "Item Dibeli": o.items_json?.map((i: any) => `${i.quantity}x ${i.name}`).join(", ") || "-",
        "Total (Rp)": o.total_amount || 0
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Laporan Penjualan");
      XLSX.writeFile(wb, "Laporan_Caloless.xlsx");
      insertLog("EXPORT", "Unduh Excel");
    } catch (e: any) { toast.error("Error: " + e.message); }
  };

  const exportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Laporan Keuangan", 14, 20);
      autoTable(doc, {
        startY: 30,
        head: [['Tanggal', 'Pemesan', 'Status', 'Total']],
        body: historyOrders.map(o => [
          new Date(o.created_at).toLocaleDateString("id-ID"),
          o.user_name,
          o.status.toUpperCase(),
          `Rp ${o.total_amount}`
        ])
      });
      doc.save("Laporan_CALOLESS.pdf");
      insertLog("EXPORT", "Unduh PDF");
    } catch (e) { }
  };

  const exportWord = async () => {
    try {
      const rows = historyOrders.map(o => new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(new Date(o.created_at).toLocaleDateString("id-ID"))] }),
          new TableCell({ children: [new Paragraph(o.user_name)] }),
          new TableCell({ children: [new Paragraph(o.status.toUpperCase())] }),
          new TableCell({ children: [new Paragraph(`Rp ${o.total_amount}`)] })
        ]
      }));
      const table = new Table({
        rows: [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Tanggal", bold: true })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Pemesan", bold: true })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Status", bold: true })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Total", bold: true })] })] })
            ]
          }), ...rows
        ]
      });
      const doc = new Document({ sections: [{ children: [new Paragraph({ text: "Laporan CALOLESS", heading: HeadingLevel.HEADING_1 }), table] }] });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, "Laporan_CALOLESS.docx");
      insertLog("EXPORT", "Unduh Word");
    } catch (e) { }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-primary">CALOLESS ERP Loading...</div>;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">

      {/* HEADER NAV */}
      <div className="bg-white dark:bg-zinc-900 border-b p-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-black tracking-tighter text-primary italic">CALOLESS ERP</h1>
          <div className="flex flex-wrap justify-center gap-2 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
            {[
              { id: 'orders', label: 'Pesanan', icon: Clock },
              { id: 'menu', label: 'Menu & Stok', icon: Utensils },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'team', label: 'Tim', icon: Users },
              { id: 'logs', label: 'Logs', icon: Activity }
            ].map((tab: any) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id ? "bg-white text-primary shadow-sm" : "text-muted-foreground"}`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">

        {/* ================= TAB 1: ORDERS ================= */}
        {activeTab === "orders" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold flex items-center gap-2"><Clock className="text-orange-500" /> Pesanan Aktif</h2>

            <div className="grid gap-4">
              {activeOrders.map((o) => (
                <div key={o.id} className="bg-white dark:bg-zinc-900 border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex-1">
                    <div className="mb-2">
                      {renderStatusBadge(o.status)}
                    </div>
                    <h3 className="text-xl font-bold">{o.user_name} <span className="text-sm font-normal text-muted-foreground">({o.customer_phone})</span></h3>
                    <div className="mt-2 space-y-1">
                      {o.items_json?.map((item: any, i: number) => (
                        <p key={i} className="text-sm flex items-center gap-2 font-medium">
                          <Package className="w-4 h-4 text-primary" /> {item.quantity}x {item.name}
                        </p>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {o.address}
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-center md:items-end gap-3">
                    <p className="text-2xl font-black text-primary">Rp {o.total_amount?.toLocaleString()}</p>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button variant="outline" onClick={() => handleCancelOrder(o.id, o.user_name)} className="rounded-full border-red-200 text-red-500 hover:bg-red-50">
                        <XCircle className="w-4 h-4 mr-2" /> Batal
                      </Button>

                      {o.address.includes("Ambil di Tempat") ? (
                        <Button onClick={() => handleCompleteOrder(o.id, o.user_name, o.items_json)} className="rounded-full bg-green-600 hover:bg-green-700 text-white">
                          <CheckCircle2 className="w-4 h-4 mr-2" /> Selesai
                        </Button>
                      ) : o.status === 'dikirim' ? (
                        <Button onClick={() => handleCompleteOrder(o.id, o.user_name, o.items_json)} className="rounded-full bg-green-600 hover:bg-green-700 text-white">
                          <CheckCircle2 className="w-4 h-4 mr-2" /> Pesanan Sampai
                        </Button>
                      ) : (
                        <Button onClick={() => handleShipOrder(o.id, o.user_name)} className="rounded-full bg-blue-600 hover:bg-blue-700 text-white">
                          <Truck className="w-4 h-4 mr-2" /> Kirim Kurir
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {activeOrders.length === 0 && (
                <div className="text-center py-20 bg-white border border-dashed rounded-2xl text-muted-foreground">
                  Tidak ada pesanan aktif.
                </div>
              )}
            </div>

            <h2 className="text-2xl font-bold flex items-center gap-2 pt-6 border-t"><History className="text-zinc-500" /> Riwayat Pesanan</h2>
            <div className="overflow-x-auto border rounded-2xl bg-white">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-50 border-b">
                  <tr>
                    <th className="px-6 py-4">Pemesan</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Waktu</th>
                    <th className="px-6 py-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {historyOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4 font-bold">{o.user_name}</td>
                      <td className="px-6 py-4">{renderStatusBadge(o.status)}</td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4 text-right font-black text-primary">Rp {o.total_amount?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 2: MENU & ERP INVENTORY ================= */}
        {activeTab === "menu" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex gap-4 border-b">
              <button
                onClick={() => setMenuSubTab("catalog")}
                className={`pb-2 px-4 font-bold transition-all ${menuSubTab === "catalog" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                Katalog Menu
              </button>
              <button
                onClick={() => setMenuSubTab("ingredients")}
                className={`pb-2 px-4 font-bold transition-all ${menuSubTab === "ingredients" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                Gudang Bahan Baku (Inventory)
              </button>
            </div>

            {menuSubTab === "catalog" ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* FORM EDIT/TAMBAH MENU */}
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-primary/20 shadow-xl h-fit space-y-4">
                  <div className="flex justify-between items-center border-b pb-3">
                    <h3 className="font-black text-primary uppercase tracking-wider">{isEditingProduct ? "Edit Menu" : "Tambah Menu"}</h3>
                    {isEditingProduct && (
                      <Button variant="ghost" size="icon" onClick={resetProductForm}>
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <input type="text" placeholder="Nama Menu (cth: Zensum)" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} className="w-full bg-zinc-50 border p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary" />
                  <input type="number" placeholder="Harga Jual (Rp)" value={newProduct.price || ""} onChange={e => setNewProduct({ ...newProduct, price: parseInt(e.target.value) })} className="w-full bg-zinc-50 border p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary" />
                  <textarea placeholder="Deskripsi Singkat" value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} className="w-full bg-zinc-50 border p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary h-24" />

                  <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100 space-y-3">
                    <p className="text-xs font-bold text-orange-600 flex items-center gap-1 uppercase"><Calculator className="w-3 h-3" /> Setup Teks Rincian</p>
                    <input type="text" placeholder="Porsi (Contoh: 3 Dimsum)" value={newProduct.portion_size} onChange={e => setNewProduct({ ...newProduct, portion_size: e.target.value })} className="w-full bg-white border p-2.5 rounded-lg text-xs" />
                    <textarea placeholder="Tulis rincian bahan (Untuk info pembeli)" value={newProduct.ingredients_text} onChange={e => setNewProduct({ ...newProduct, ingredients_text: e.target.value })} className="w-full bg-white border p-2.5 rounded-lg text-xs h-16" />
                    <p className="text-[10px] text-orange-500 italic mt-1">*Total Kalori kini dihitung otomatis oleh sistem ERP berdasarkan Resep SQL.</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t">
                    <label className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1"><UploadCloud className="w-3 h-3" /> Foto Menu</label>
                    <input type="file" accept="image/*" onChange={handleProductUpload} disabled={isUploadingProduct} className="w-full text-xs cursor-pointer file:bg-primary/10 file:text-primary file:border-0 file:rounded-full file:px-4 file:py-2" />
                    {newProduct.image_url && (
                      <div className="relative w-full h-32 rounded-xl overflow-hidden mt-2 border-2 border-primary/20">
                        <Image src={newProduct.image_url} alt="Preview" fill className="object-cover" />
                      </div>
                    )}
                  </div>

                  <Button onClick={handleSaveProduct} disabled={isUploadingProduct} className="w-full rounded-xl font-bold py-6 shadow-lg">
                    {isEditingProduct ? "Update Identitas Menu" : "Simpan Menu Baru"}
                  </Button>
                </div>

                {/* CATALOG LIST */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {products.map((p) => {
                    const autoTotalKcal = calculateAutoTotal(p.product_ingredients);
                    return (
                      <div key={p.id} className={`group bg-white dark:bg-zinc-900 rounded-3xl border shadow-sm overflow-hidden transition-all hover:shadow-xl ${editProductId === p.id ? 'ring-2 ring-primary border-transparent' : ''}`}>

                        <div className="relative h-56 bg-zinc-100 border-b">
                          {p.image_url ? (
                            <Image src={p.image_url} alt={p.name} fill className="object-cover transition-transform group-hover:scale-105" />
                          ) : (
                            <ImageIcon className="w-12 h-12 m-auto absolute inset-0 text-zinc-300" />
                          )}

                          <div className="absolute inset-0 bg-black/80 text-white p-6 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center backdrop-blur-md">
                            <p className="text-xs font-black text-primary uppercase mb-2 flex items-center gap-2"><Info className="w-4 h-4" /> Rincian Kalori (Resep)</p>
                            <div className="space-y-1.5 overflow-y-auto max-h-32 pr-2 custom-scrollbar">
                              {p.product_ingredients?.map((ri: any, i: number) => (
                                <div key={i} className="flex justify-between items-center text-[11px] border-b border-white/10 pb-1">
                                  <span className="flex items-center gap-1.5"><UtensilsCrossed className="w-3 h-3 text-primary" /> {ri.ingredients?.name} ({ri.amount_needed}{ri.ingredients?.unit})</span>
                                  <span className="font-bold">{(ri.amount_needed * (ri.ingredients?.calories_per_unit || 0)).toFixed(0)} kkal</span>
                                </div>
                              ))}
                              {p.product_ingredients?.length === 0 && <p className="text-[10px] italic text-zinc-400">Belum ada resep SQL.</p>}
                            </div>
                            <div className="mt-auto pt-3 border-t border-white/20 flex justify-between items-center">
                              <span className="text-xs font-medium uppercase tracking-widest text-primary">Sistem Auto Total</span>
                              <span className="text-2xl font-black text-white">{autoTotalKcal} <span className="text-xs text-primary">Kkal</span></span>
                            </div>
                          </div>
                        </div>

                        <div className="p-5 flex flex-col flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="text-lg font-black leading-tight text-zinc-800">{p.name}</h4>

                            {/* PERBAIKAN RESPONSIVE HOVER: opacity-100 di HP, opacity-0 di Laptop */}
                            <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              <button onClick={() => startEditProduct(p)} className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100"><Edit3 className="w-4 h-4" /></button>
                              <button onClick={async () => { if (confirm("Hapus menu?")) { await supabase.from("products").delete().eq("id", p.id); fetchData(); } }} className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>
                            </div>

                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-4 h-8">{p.description}</p>

                          <div className="grid grid-cols-2 gap-3 mt-auto">
                            <div className="bg-zinc-50 p-3 rounded-2xl border text-center">
                              <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Harga Jual</p>
                              <p className="text-lg font-black text-primary italic">Rp {p.price?.toLocaleString()}</p>
                            </div>
                            <div className="bg-orange-50 p-3 rounded-2xl border border-orange-100 text-center">
                              <p className="text-[10px] font-bold text-orange-600 uppercase mb-1">Stok Porsi</p>
                              <div className="flex items-center justify-between px-1">
                                <button onClick={() => updateProductStockOnly(p.id, p.name, p.stock ?? 100, -1)} className="font-black text-orange-600 text-xl hover:scale-110">-</button>
                                <span className="font-black text-xl">{p.stock}</span>
                                <button onClick={() => updateProductStockOnly(p.id, p.name, p.stock ?? 100, 1)} className="font-black text-orange-600 text-xl hover:scale-110">+</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* GUDANG BAHAN BAKU FORM */}
                <div className="bg-white p-6 rounded-3xl border shadow-lg h-fit space-y-4 border-primary/20 bg-primary/5">
                  <div className="flex justify-between items-center border-b pb-3">
                    <h3 className="font-black text-primary uppercase tracking-wider">{isEditingIng ? "Edit Gudang" : "Input Gudang"}</h3>
                    {isEditingIng && (
                      <Button variant="ghost" size="icon" onClick={resetIngForm}>
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <input type="text" placeholder="Nama Bahan (Misal: Dada Ayam)" value={newIng.name} onChange={e => setNewIng({ ...newIng, name: e.target.value })} className="w-full bg-zinc-50 border p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary" />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="Satuan (gr/ml/pcs)" value={newIng.unit} onChange={e => setNewIng({ ...newIng, unit: e.target.value })} className="w-full bg-zinc-50 border p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary" />
                    <input type="number" placeholder="Kalori per Unit" value={newIng.calories_per_unit || ""} onChange={e => setNewIng({ ...newIng, calories_per_unit: parseFloat(e.target.value) })} className="w-full bg-zinc-50 border p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <input type="number" placeholder="Stok Aktual" value={newIng.stock_quantity || ""} onChange={e => setNewIng({ ...newIng, stock_quantity: parseFloat(e.target.value) })} className="w-full bg-zinc-50 border p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary" />

                  <Button onClick={handleSaveIngredient} className="w-full py-6 rounded-xl font-bold shadow-md">
                    {isEditingIng ? "Perbarui Inventaris" : "Simpan ke Inventaris"}
                  </Button>
                </div>

                {/* GUDANG LIST */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {ingredients.map(ing => (
                    <div key={ing.id} className={`bg-white p-5 rounded-2xl border shadow-sm flex flex-col hover:border-primary/50 transition-all group ${editIngId === ing.id ? 'ring-2 ring-primary border-transparent' : ''}`}>
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-black text-zinc-700 text-sm uppercase">{ing.name}</p>

                        {/* PERBAIKAN RESPONSIVE HOVER: opacity-100 di HP, opacity-0 di Laptop */}
                        <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEditIng(ing)} className="p-1.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDeleteIngredient(ing.id, ing.name)} className="p-1.5 bg-red-50 text-red-600 rounded-full hover:bg-red-100"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>

                      </div>

                      <div className="flex items-end justify-between mt-auto">
                        <div>
                          <p className={`text-2xl font-black ${ing.stock_quantity < 500 ? 'text-red-500' : 'text-primary'}`}>
                            {ing.stock_quantity.toLocaleString()} <span className="text-xs font-medium text-muted-foreground uppercase">{ing.unit}</span>
                          </p>
                          <p className="text-[10px] text-muted-foreground font-bold mt-1 bg-zinc-100 px-2 py-0.5 rounded inline-block">
                            {ing.calories_per_unit} Kkal / {ing.unit}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {ingredients.length === 0 && <div className="col-span-full text-center py-10 text-muted-foreground border border-dashed rounded-xl">Gudang kosong.</div>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: ANALYTICS & EXPORT ================= */}
        {activeTab === "analytics" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Laporan Performa</h2>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={exportPDF} className="gap-2 rounded-xl text-red-600 border-red-200 hover:bg-red-50"><FileText className="w-4 h-4" /> PDF</Button>
                <Button variant="outline" onClick={exportExcel} className="gap-2 rounded-xl border-green-200 text-green-600 hover:bg-green-50"><FileSpreadsheet className="w-4 h-4" /> Excel</Button>
                <Button variant="outline" onClick={exportWord} className="gap-2 rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50"><File className="w-4 h-4" /> Word</Button>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-3xl border shadow-sm h-80">
                <h3 className="font-bold mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> Tren Penjualan</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={(val) => `${val / 1000}k`} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(value: any) => `Rp ${Number(value).toLocaleString("id-ID")}`} />
                    <Line type="monotone" dataKey="Pendapatan" stroke="#8b5cf6" strokeWidth={4} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-3xl border shadow-sm h-80">
                <h3 className="font-bold mb-4 flex items-center gap-2"><Package className="w-4 h-4 text-orange-500" /> Item Terlaris (Biji)</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={itemSoldData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="Terjual" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: LOGS ================= */}
        {activeTab === "logs" && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-2xl font-bold flex gap-2"><Activity className="text-primary" /> Audit Log Aktivitas</h2>
            <div className="bg-white border rounded-2xl shadow-sm overflow-hidden max-h-[600px] overflow-y-auto">
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

        {/* ================= TAB 5: TIM ================= */}
        {activeTab === "team" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-2xl font-bold flex gap-2"><Users className="text-primary" /> Anggota Kelompok 7</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* FORM DINAMIS (TAMBAH / EDIT) */}
              <div className="lg:col-span-1 bg-white border rounded-2xl p-6 shadow-sm h-fit space-y-4 border-primary/20 bg-primary/5">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-primary">{isEditingTeam ? "Edit Profil Anggota" : "Daftarkan Anggota"}</h3>
                  {isEditingTeam && <Button variant="ghost" size="icon" onClick={resetTeamForm} className="h-6 w-6"><X className="w-4 h-4" /></Button>}
                </div>

                <input type="text" placeholder="Nama Lengkap" value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
                <input type="text" placeholder="Role (cth: Hacker)" value={newMember.role} onChange={(e) => setNewMember({ ...newMember, role: e.target.value })} className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
                <input type="number" placeholder="Urutan (1-10)" value={newMember.order_priority} onChange={(e) => setNewMember({ ...newMember, order_priority: parseInt(e.target.value) })} className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />

                <div className="space-y-2 pt-2 border-t">
                  <label className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 uppercase tracking-wider"><UploadCloud className="w-3.5 h-3.5" /> Ganti Foto Profil</label>
                  <input type="file" accept="image/*" onChange={handleTeamUpload} disabled={isUploadingTeam} className="w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-primary/20 file:text-primary cursor-pointer" />
                  {newMember.photo_url && (
                    <div className="relative w-16 h-16 rounded-full border-2 border-primary/30 overflow-hidden mt-2">
                      <Image src={newMember.photo_url} alt="Preview" fill className="object-cover" />
                    </div>
                  )}
                </div>

                <Button onClick={handleSaveTeam} disabled={isUploadingTeam} className="w-full font-bold shadow-md">
                  {isEditingTeam ? <><Edit3 className="w-4 h-4 mr-2" /> Perbarui Identitas</> : <><Plus className="w-4 h-4 mr-2" /> Simpan Anggota</>}
                </Button>
              </div>

              {/* LIST ANGGOTA */}
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {team.map((member) => (
                  <div key={member.id} className={`bg-white border rounded-2xl p-4 shadow-sm flex items-center justify-between group transition-all ${editTeamId === member.id ? 'border-primary ring-2 ring-primary/20' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-zinc-100">
                        <Image src={member.photo_url || "/team-1.png"} alt={member.name} fill className="object-cover" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm leading-tight">{member.name}</h4>
                        <p className="text-[10px] text-primary font-black uppercase">{member.role}</p>
                      </div>
                    </div>

                    {/* PERBAIKAN RESPONSIVE HOVER: opacity-100 di HP, opacity-0 di Laptop */}
                    <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:bg-blue-50" onClick={() => startEditTeam(member)}>
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleDeleteTeam(member.id, member.name)}>
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