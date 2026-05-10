import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollRevealLeft, ScrollRevealRight } from "./ScrollReveal";
import { createClient } from "@/lib/supabase/server";

export async function HeroSection() {
  const supabase = await createClient();
  const { data: team } = await supabase
    .from("team_members")
    .select("image_url")
    .order("order_index")
    .limit(4);

  const avatars = team?.map(t => t.image_url).filter(Boolean) || ["/team-1.png"];

  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/20 blur-3xl opacity-50" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-secondary blur-3xl opacity-50" />
      </div>

      <div className="container mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <ScrollRevealLeft className="flex flex-col gap-6 text-center md:text-left z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/80 text-primary w-fit mx-auto md:mx-0 text-sm font-medium border border-primary/20 shadow-sm backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Inovasi Kuliner Rendah Kalori
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              Camilan <span className="text-primary relative inline-block">
                "guilt-free"
                <svg className="absolute w-full h-3 -bottom-1 left-0 text-primary/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="transparent" />
                </svg>
              </span><br />
              untuk gaya hidup sehatmu.
            </h1>

            <p className="text-lg text-muted-foreground md:text-xl max-w-[600px] mx-auto md:mx-0">
              Nikmati kelezatan Zensum dan kesegaran Ubi Drink tanpa khawatir kalori berlebih. Dibuat dengan Stevia dan Low Fat Milk.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-4 justify-center md:justify-start">
              <Link href="#katalog" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto rounded-full gap-2 text-base h-14 px-8 shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                  <ShoppingBag className="w-5 h-5" />
                  Pesan Sekarang
                </Button>
              </Link>
              <Link href="#usp" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full gap-2 text-base h-14 px-8 hover:bg-secondary border-2 transition-colors">
                  Kenapa Caloless? <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-4 mt-6 justify-center md:justify-start text-sm text-muted-foreground font-medium">
              <div className="flex -space-x-3">
              </div>
            </div>
          </ScrollRevealLeft>

          <ScrollRevealRight className="relative mx-auto md:ml-auto w-full max-w-[500px] aspect-square z-10">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-transparent rounded-full blur-3xl animate-pulse" />
            <div className="relative w-full h-full rounded-[2rem] overflow-hidden shadow-2xl border border-white/20 bg-white/10 backdrop-blur-sm transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <Image
                src="/hero.png"
                alt="Caloless Zensum & Ubi Drink"
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Floating badges */}
            <div className="absolute -top-6 -left-6 bg-white dark:bg-zinc-900 shadow-xl rounded-2xl p-4 flex items-center gap-3 animate-bounce" style={{ animationDuration: '3s' }}>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-lg">
                🍃
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pemanis</p>
                <p className="font-bold text-foreground">Gula Stevia</p>
              </div>
            </div>

            <div className="absolute -bottom-6 -right-6 bg-white dark:bg-zinc-900 shadow-xl rounded-2xl p-4 flex items-center gap-3 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                🥛
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Susu</p>
                <p className="font-bold text-foreground">Low Fat</p>
              </div>
            </div>
          </ScrollRevealRight>
        </div>
      </div>
    </section>
  );
}
