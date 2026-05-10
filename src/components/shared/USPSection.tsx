import { Leaf, Droplets, Flame } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

export function USPSection() {
  const usps = [
    {
      title: "Gula Stevia",
      description: "Menggunakan pemanis alami 0 kalori, aman untuk kadar gula darah dan tidak menyebabkan penambahan berat badan.",
      icon: <Leaf className="w-8 h-8 text-green-500" />,
      color: "bg-green-100 dark:bg-green-950/50 border-green-200 dark:border-green-900",
    },
    {
      title: "Low Fat Milk",
      description: "Susu rendah lemak yang kaya kalsium namun lebih rendah kalori, memberikan rasa creamy tanpa rasa bersalah.",
      icon: <Droplets className="w-8 h-8 text-blue-500" />,
      color: "bg-blue-100 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900",
    },
    {
      title: "No Deep Frying",
      description: "Proses memasak Zensum melalui pengukusan, menghindari lemak jenuh dan kalori tinggi dari minyak goreng.",
      icon: <Flame className="w-8 h-8 text-orange-500" />,
      color: "bg-orange-100 dark:bg-orange-950/50 border-orange-200 dark:border-orange-900",
    },
  ];

  return (
    <section id="usp" className="py-24 bg-white dark:bg-zinc-950">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollReveal className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Rahasia Rendah Kalori Kami</h2>
          <p className="text-lg text-muted-foreground">
            Inovasi pangan yang menggabungkan cita rasa lezat dengan bahan-bahan yang menyehatkan tubuh Anda.
          </p>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-8">
          {usps.map((usp, index) => (
            <ScrollReveal key={index} delay={index * 0.1}>
              <div 
                className="h-full group relative bg-white dark:bg-zinc-900 border border-border p-8 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border ${usp.color} transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                  {usp.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{usp.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {usp.description}
                </p>
                
                {/* Decorative accent */}
                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-10 transition-opacity">
                  {usp.icon}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
