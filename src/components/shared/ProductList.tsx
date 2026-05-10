import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "./ProductCard";
import { Product } from "@/store/useCartStore";
import { ScrollReveal } from "./ScrollReveal";

// Mock data as fallback when Supabase is not configured
const mockProducts: Product[] = [
  {
    id: "1",
    name: "Zensum (Dimsum Sehat)",
    description: "Dimsum kukus rendah kalori dengan campuran bahan sehat premium.",
    price: 15000,
    image_url: "/hero.png",
  },
  {
    id: "2",
    name: "Ubi Drink",
    description: "Minuman ungu segar dari ekstrak ubi dengan pemanis Stevia dan Low Fat Milk.",
    price: 12000,
    image_url: "/hero.png",
  },
  {
    id: "3",
    name: "Ubi Cheese Chia Seeds",
    description: "Dessert ubi ungu dengan paduan keju rendah lemak dan chia seeds kaya serat.",
    price: 18000,
    image_url: "/hero.png",
  }
];

export async function ProductList() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let products: Product[] = [];
  let isUsingMock = false;

  if (!supabaseUrl || !supabaseKey) {
    // Fallback if env vars are missing
    isUsingMock = true;
    products = mockProducts;
  } else {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("id", { ascending: true });

      // Supabase returns an error object if the table doesn't exist
      if (error) {
        console.error("Error fetching products:", error.message || error);
        isUsingMock = true;
        products = mockProducts;
      } else if (data) {
        // Only use real data if it exists and array is not empty, otherwise show mock just for the demo
        if (data.length === 0) {
          isUsingMock = true;
          products = mockProducts;
        } else {
          products = data as Product[];
        }
      }
    } catch (error) {
      console.error("Supabase client error:", error);
      isUsingMock = true;
      products = mockProducts;
    }
  }

  return (
    <section id="katalog" className="py-24 bg-secondary/30 dark:bg-zinc-900 relative">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollReveal className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Katalog Produk</h2>
          <p className="text-lg text-muted-foreground">
            Sajian sehat, nikmat, dan bebas khawatir.
          </p>
          {isUsingMock && (
            <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-sm rounded-lg inline-block border border-yellow-200 dark:border-yellow-800">
              ⚠️ Menampilkan data dummy karena Supabase belum dikonfigurasi atau tabel kosong.
            </div>
          )}
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <ScrollReveal key={product.id} delay={index * 0.1}>
              <ProductCard product={product} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}