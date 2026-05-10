import { createClient } from "@/lib/supabase/server";
import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { PhotoUploadButton } from "@/components/admin/PhotoUploadButton";
import Image from "next/image";
import Link from "next/link";
import { LogOut, Home } from "lucide-react";

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Fetch products
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("id");

  // Fetch team members
  const { data: teamMembers } = await supabase
    .from("team_members")
    .select("*")
    // PERBAIKAN 1: Ganti order_index menjadi order_priority
    .order("order_priority");

  return (
    <div className="min-h-screen bg-secondary/20 pb-20">
      {/* Top Navbar */}
      <header className="bg-white dark:bg-zinc-950 border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="font-bold text-xl text-primary">CALOLESS Admin</h1>
            <div className="h-6 w-px bg-border hidden sm:block"></div>
            <Link href="/" className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Home className="w-4 h-4" /> View Site
            </Link>
          </div>

          <form action={logoutAction}>
            <Button variant="ghost" size="sm" type="submit" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 gap-2">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </form>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-10">
          <h2 className="text-3xl font-extrabold mb-2">Dashboard Manajemen</h2>
          <p className="text-muted-foreground">Ubah foto produk dan tim secara real-time tanpa perlu deployment ulang.</p>
        </div>

        <div className="space-y-12">
          {/* Products Section */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 text-xl">
                📦
              </div>
              <h3 className="text-2xl font-bold">Katalog Produk</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {products?.map((product) => (
                <div key={product.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-border p-5 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-secondary shrink-0 border border-border">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No Image</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-lg mb-1">{product.name}</h4>
                    <p className="text-sm font-medium text-primary mb-3">Rp {product.price.toLocaleString("id-ID")}</p>
                    <PhotoUploadButton id={product.id} table="products" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <hr className="border-border" />

          {/* Team Members Section */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 text-xl">
                👥
              </div>
              <h3 className="text-2xl font-bold">Anggota Tim</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {teamMembers?.map((member) => (
                <div key={member.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-border p-5 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden bg-secondary mb-4 border-4 border-white dark:border-zinc-800 shadow-lg">
                    {/* PERBAIKAN 2: Ganti member.image_url menjadi member.photo_url */}
                    {member.photo_url ? (
                      <Image
                        src={member.photo_url}
                        alt={member.name}
                        fill
                        className="object-cover"
                        sizes="128px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No Image</div>
                    )}
                  </div>
                  <h4 className="font-bold text-lg">{member.name}</h4>
                  <p className="text-sm text-primary font-medium mb-4">{member.role}</p>

                  <PhotoUploadButton id={member.id} table="team_members" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}