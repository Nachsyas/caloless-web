"use client";

import { useState, useEffect } from "react";
import { Sparkles, Info } from "lucide-react";

// Data Bahan Baku Asli CALOLESS (15 Item)
const INGREDIENTS = [
    { id: 1, icon: "🍠", name: "Ubi Ungu", desc: "Karbohidrat kompleks kaya antioksidan. Pengganti tepung yang memberikan rasa manis alami dengan indeks glikemik sangat rendah." },
    { id: 2, icon: "🌿", name: "Stevia", desc: "Pemanis alami keajaiban alam! Memberikan rasa manis yang memanjakan lidah tanpa menyumbang kalori dan bikin gula darah melonjak." },
    { id: 3, icon: "🥛", name: "Susu Lowfat", desc: "Tekstur creamy tanpa rasa bersalah. Kami menggunakan varian rendah lemak untuk menjaga defisit kalorimu tetap aman." },
    { id: 4, icon: "🍗", name: "Dada Ayam", desc: "Tinggi protein, rendah lemak! Membantu pembentukan otot dan mengenyangkan lebih lama tanpa menimbun lemak jahat." },
    { id: 5, icon: "🍤", name: "Udang", desc: "Kaya protein, omega-3, dan rendah kalori. Memberikan tekstur kenyal dan rasa gurih laut yang bikin Zensum makin nagih!" },
    { id: 6, icon: "🥚", name: "Telur", desc: "Superfood padat nutrisi! Sumber protein berkualitas tinggi untuk mengikat adonan dengan sempurna dan kaya akan vitamin." },
    { id: 7, icon: "🧄", name: "Bawang Putih", desc: "Aroma sedap alami! Kaya akan antioksidan dan antimikroba, memberikan rasa umami kuat tanpa tambahan kalori berarti." },
    { id: 8, icon: "🦪", name: "Saus Tiram", desc: "Kunci rahasia rasa gurih Asia yang otentik. Kami takar dengan sangat presisi agar rasanya maksimal dengan kalori minimal." },
    { id: 9, icon: "🧀", name: "Keju", desc: "Memberikan sensasi leleh yang gurih lezat. Kaya kalsium, namun tetap ditakar presisi agar tidak merusak batas kalori harianmu." },
    { id: 10, icon: "🥕", name: "Wortel", desc: "Menambahkan tekstur renyah dan manis alami. Penuh vitamin A dan serat yang sangat baik untuk pencernaan dan kesehatan mata." },
    { id: 11, icon: "🧅", name: "Daun Bawang", desc: "Pemberi aroma segar dan tekstur renyah. Membangkitkan selera makan dengan sentuhan hijau yang kaya akan vitamin." },
    { id: 12, icon: "🧂", name: "Garam", desc: "Penyeimbang rasa yang krusial. Kami gunakan takaran yang sangat pas agar lezat namun tetap aman untuk tekanan darahmu." },
    { id: 13, icon: "🍲", name: "Penyedap Rasa", desc: "Sedikit sentuhan untuk menyempurnakan harmoni rasa. Ditakar dengan perhitungan ketat untuk menghindari efek samping berlebih." },
    { id: 14, icon: "🌶️", name: "Merica", desc: "Sentuhan hangat dan pedas ringan yang memperkaya dimensi rasa, sekaligus membantu mempercepat metabolisme tubuh alami." },
    { id: 15, icon: "🫔", name: "Kulit Tahu", desc: "Pengganti kulit pangsit yang jenius! Jauh lebih rendah karbohidrat, tinggi protein kedelai, dan super lezat saat dikukus." },
];

const Typewriter = ({ text }: { text: string }) => {
    const [displayedText, setDisplayedText] = useState("");

    useEffect(() => {
        setDisplayedText("");
        let i = 0;
        const interval = setInterval(() => {
            setDisplayedText(text.slice(0, i + 1));
            i++;
            if (i >= text.length) clearInterval(interval);
        }, 30);

        return () => clearInterval(interval);
    }, [text]);

    return <span>{displayedText}</span>;
};

export function IngredientWalking() {
    const [activeIngredient, setActiveIngredient] = useState(INGREDIENTS[0]);

    return (
        <div className="w-full py-16 overflow-hidden bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950 dark:to-zinc-900 border-y border-zinc-100 dark:border-zinc-800 relative">

            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 45s linear infinite; /* Diperlambat dari 30s ke 45s karena itemnya banyak */
        }
        .group:hover .animate-marquee {
          animation-play-state: paused;
        }
      `}} />

            <div className="container mx-auto px-4 md:px-6 mb-4 text-center">
                <h2 className="text-2xl md:text-3xl font-black text-zinc-800 dark:text-white mb-2 flex items-center justify-center gap-2">
                    <Sparkles className="w-6 h-6 text-primary" />
                    Bahan Rahasia CALOLESS
                </h2>
                <p className="text-sm text-muted-foreground">Ketuk bahan di bawah ini untuk melihat keunggulannya!</p>
            </div>

            <div className="relative w-full overflow-hidden mb-10 flex group">

                <div className="absolute top-0 left-0 w-16 md:w-32 h-full bg-gradient-to-r from-white dark:from-zinc-950 to-transparent z-10 pointer-events-none"></div>
                <div className="absolute top-0 right-0 w-16 md:w-32 h-full bg-gradient-to-l from-white dark:from-zinc-950 to-transparent z-10 pointer-events-none"></div>

                {/* GERBONG 1 */}
                <div className="flex animate-marquee shrink-0 gap-4 md:gap-8 items-center py-8 pr-4 md:pr-8">
                    {INGREDIENTS.map((item, index) => (
                        <div
                            key={`track1-${index}`}
                            onClick={() => setActiveIngredient(item)}
                            className="flex flex-col items-center justify-center cursor-pointer transition-all duration-300"
                        >
                            <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full bg-white dark:bg-zinc-900 border-4 flex items-center justify-center text-4xl md:text-5xl transition-all duration-300 ${activeIngredient.id === item.id ? 'border-primary shadow-[0_0_20px_rgba(139,92,246,0.4)] scale-110' : 'border-zinc-100 dark:border-zinc-800 opacity-60 hover:opacity-100 hover:scale-105'}`}>
                                {item.icon}
                            </div>
                            <span className={`mt-4 font-bold text-sm transition-all duration-300 whitespace-nowrap ${activeIngredient.id === item.id ? 'text-primary scale-110' : 'text-muted-foreground opacity-60'}`}>
                                {item.name}
                            </span>
                        </div>
                    ))}
                </div>

                {/* GERBONG 2 (Kloningan) */}
                <div className="flex animate-marquee shrink-0 gap-4 md:gap-8 items-center py-8 pr-4 md:pr-8" aria-hidden="true">
                    {INGREDIENTS.map((item, index) => (
                        <div
                            key={`track2-${index}`}
                            onClick={() => setActiveIngredient(item)}
                            className="flex flex-col items-center justify-center cursor-pointer transition-all duration-300"
                        >
                            <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full bg-white dark:bg-zinc-900 border-4 flex items-center justify-center text-4xl md:text-5xl transition-all duration-300 ${activeIngredient.id === item.id ? 'border-primary shadow-[0_0_20px_rgba(139,92,246,0.4)] scale-110' : 'border-zinc-100 dark:border-zinc-800 opacity-60 hover:opacity-100 hover:scale-105'}`}>
                                {item.icon}
                            </div>
                            <span className={`mt-4 font-bold text-sm transition-all duration-300 whitespace-nowrap ${activeIngredient.id === item.id ? 'text-primary scale-110' : 'text-muted-foreground opacity-60'}`}>
                                {item.name}
                            </span>
                        </div>
                    ))}
                </div>

            </div>

            <div className="container mx-auto px-4 max-w-2xl">
                <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 md:p-8 min-h-[160px] relative transition-all duration-300 shadow-sm hover:shadow-md">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-sm whitespace-nowrap">
                        <Info className="w-3 h-3" /> Mengapa pakai {activeIngredient.name}?
                    </div>
                    <p className="text-center text-zinc-700 dark:text-zinc-300 text-lg md:text-xl font-medium leading-relaxed mt-2">
                        <Typewriter text={activeIngredient.desc} />
                        <span className="animate-pulse text-primary font-black ml-1">|</span>
                    </p>
                </div>
            </div>

        </div>
    );
}