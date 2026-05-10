import { Navbar } from "@/components/shared/Navbar";
import { HeroSection } from "@/components/shared/HeroSection";
import { USPSection } from "@/components/shared/USPSection";
import { AboutTeam } from "@/components/shared/AboutTeam";
import { Footer } from "@/components/shared/Footer";
import { ProductList } from "@/components/shared/ProductList";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1">
        <HeroSection />
        <USPSection />
        
        <ProductList />

        <AboutTeam />
      </div>

      <Footer />
    </main>
  );
}
