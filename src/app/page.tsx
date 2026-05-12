import { Navbar } from "@/components/shared/Navbar";
import { HeroSection } from "@/components/shared/HeroSection";
import { USPSection } from "@/components/shared/USPSection";
import { AboutTeam } from "@/components/shared/AboutTeam";
import { Footer } from "@/components/shared/Footer";
import { ProductList } from "@/components/shared/ProductList";
import { IngredientWalking } from "@/components/shared/IngredientWalking";
import { Mascot } from "@/components/shared/Mascot";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden">
      <Navbar />

      <div className="flex-1">
        <HeroSection />
        <USPSection />

        {/* ANIMASI IKON BERJALAN MUNCUL DI SINI (Di atas Katalog) */}
        <IngredientWalking />

        <ProductList />

        <AboutTeam />
      </div>

      <Footer />

      {/* MASKOT KITA NONGKRONG DI SINI (Pojok Layar) */}
      <Mascot />
    </main>
  );
}