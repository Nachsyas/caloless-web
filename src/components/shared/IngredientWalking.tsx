"use client";

import { useState, useEffect } from "react";
import { Sparkles, Info } from "lucide-react";

// Data Bahan Baku (Bisa menggunakan Emoji agar berwarna dan menarik)
const INGREDIENTS = [
    { id: 1, icon: "🍗", name: "Dada Ayam", desc: "Tinggi protein, rendah lemak! Membantu pembentukan otot dan mengenyangkan tanpa menimbun lemak jahat." },
    { id: 2, icon: "🧀", name: "Keju", desc: "Memberikan rasa gurih lezat khas Zensum. Kaya kalsium, namun tetap kami takar presisi agar tetap rendah kalori." },
    { id: 3, icon: "🥛", name: "Susu", desc: "Tekstur creamy tanpa rasa bersalah. Kami menggunakan susu khusus untuk menjaga defisit kalorimu tetap aman." },
    { id: 4, icon: "🌾", name: "Chia Seeds", desc: "Superfood mungil penuh keajaiban! Kaya serat, bikin kenyang lebih lama, dan sangat baik untuk pencernaan sehat." },
    { id: 5, icon: "🍠", name: "Ubi Ungu", desc: "Karbohidrat kompleks kaya antioksidan. Pengganti tepung yang memberikan manis alami dengan indeks glikemik sangat rendah." },
    { id: 6, icon: "🥟", name: "Kulit Dimsum", desc: "Tipis, kenyal, dan lembut. Membungkus semua nutrisi padat di dalamnya dengan sempurna tanpa menambah kalori berlebih." },
];

// Sub-Komponen: Efek Mesin Tik (Typewriter)
const Typewriter = ({ text }: { text: string }) => {
    const [displayedText, setDisplayedText] = useState("");

    useEffect(() => {
        setDisplayedText(""); // Reset teks setiap kali bahan berubah
        let i = 0;
        const interval = setInterval(() => {
            setDisplayedText(text.slice(0, i + 1));
            i++;
            if (i >= text.length) clearInterval(interval);
        }, 30); // Kecepatan ngetik (30ms per huruf)

        return () => clearInterval(interval);
    }, [text]);

    return <span>{displayedText}</span>;
};

export function IngredientWalking() {
    // Secara default menampilkan deskripsi bahan pertama
    const [activeIngredient, setActiveIngredient] = useState(INGREDIENTS[0]);

    return (
        <div className="w-full py-16 overflow-hidden bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950 dark:to-zinc-900 border-y border-zinc-100 dark:border-zinc-800 relative">

            {/* CSS Kustom Khusus Animasi Berjalan (Marquee) */}
            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes walk {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-walk {
          display: flex;
          width: max-content;
          animation: walk 25s linear infinite;
        }
        .animate-walk:hover {
          animation-play-state: paused; /* Berhenti saat kursor diarahkan (khusus laptop) */
        }
      `}} />

            <div className="container mx-auto px-4 md:px-6 mb-8 text-center">
                <h2 className="text-2xl md:text-3xl font-black text-zinc-800 dark:text-white mb-2 flex items-center justify-center gap-2">
                    <Sparkles className="w-6 h-6 text-primary" />
                    Rahasia Dapur CALOLESS
                </h2>
                <p className="text-sm text-muted-foreground">Ketuk bahan di bawah ini untuk melihat manfaatnya!</p>
            </div>

            {/* Area Ikon Berjalan */}
            <div className="relative w-full overflow-hidden mb-10">
                {/* Efek gradient bayangan di kiri-kanan agar kesan muncul/menghilang halus */}
                <div className="absolute top-0 left-0 w-16 md:w-32 h-full bg-gradient-to-r from-white dark:from-zinc-950 to-transparent z-10 pointer-events-none"></div>
                <div className="absolute top-0 right-0 w-16 md:w-32 h-full bg-gradient-to-l from-white dark:from-zinc-950 to-transparent z-10 pointer-events-none"></div>

                <div className="animate-walk gap-4 md:gap-8 px-4">
                    {/* Kita render 2 kali array-nya agar animasinya nyambung terus (infinite loop) */}
                    {[...INGREDIENTS, ...INGREDIENTS].map((item, index) => (
                        <div
                            key={index}
                            onClick={() => setActiveIngredient(item)}
                            className={`flex flex-col items-center justify-center cursor-pointer transition-all duration-300 transform hover:scale-110 active:scale-95 ${activeIngredient.id === item.id ? 'opacity-100 scale-110' : 'opacity-50 hover:opacity-100'}`}
                        >
                            <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full bg-white dark:bg-zinc-900 border-4 shadow-lg flex items-center justify-center text-4xl md:text-5xl transition-colors ${activeIngredient.id === item.id ? 'border-primary shadow-primary/20' : 'border-zinc-100 dark:border-zinc-800'}`}>
                                {item.icon}
                            </div>
                            <span className={`mt-3 font-bold text-sm ${activeIngredient.id === item.id ? 'text-primary' : 'text-muted-foreground'}`}>
                                {item.name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Area Deskripsi Mesin Tik */}
            <div className="container mx-auto px-4 max-w-2xl">
                <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 md:p-8 min-h-[160px] relative">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-1">
                        <Info className="w-3 h-3" /> Mengapa pakai {activeIngredient.name}?
                    </div>
                    <p className="text-center text-zinc-700 dark:text-zinc-300 text-lg md:text-xl font-medium leading-relaxed mt-2">
                        <Typewriter text={activeIngredient.desc} />
                        <span className="animate-pulse text-primary font-black ml-1">|</span> {/* Kursor berkedip ala Terminal */}
                    </p>
                </div>
            </div>

        </div>
    );
}