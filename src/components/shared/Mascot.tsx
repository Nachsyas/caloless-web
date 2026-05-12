"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
// @ts-ignore
import useSound from "use-sound";

export function Mascot() {
    const [isHovered, setIsHovered] = useState(false);
    const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);

    // Hook audio (pastikan file hello.mp3 ada di public/sounds/)
    const [playMascotSound] = useSound("/sounds/hello.mp3");

    // EFEK SAMBUTAN OTOMATIS
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsWelcomeOpen(true);
            toast("✨ Selamat Datang di CALOLESS!", {
                description: "Halo! Aku asisten sehatmu. Mau cari camilan rendah kalori apa hari ini?",
                duration: 5000,
            });
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    const handleMascotClick = () => {
        playMascotSound();
        setIsWelcomeOpen(false);

        toast.success("Halo kembali! 🥗", {
            description: "Jangan lupa cek total kalori di menu favoritmu ya!",
        });
    };

    return (
        <div
            className="fixed bottom-6 left-6 z-50 cursor-pointer transition-transform duration-300"
            style={{ transform: (isHovered || isWelcomeOpen) ? 'scale(1.1)' : 'scale(1)' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleMascotClick}
        >
            {/* CSS Animasi Mengambang */}
            <style dangerouslySetInnerHTML={{
                __html: `
              @keyframes float {
                0% { transform: translateY(0px); }
                50% { transform: translateY(-12px); }
                100% { transform: translateY(0px); }
              }
              .animate-float {
                animation: float 3s ease-in-out infinite;
              }
            `}} />

            {/* BALON TEKS SAMBUTAN */}
            {(isHovered || isWelcomeOpen) && (
                <div className="absolute -top-16 left-0 bg-white text-primary font-bold px-4 py-2 rounded-2xl shadow-xl border border-primary/20 animate-bounce whitespace-nowrap text-sm">
                    Welcome to CALOLESS! ✨
                </div>
            )}

            {/* MASKOT PEREMPUAN BERKERUDUNG */}
            <div className="w-20 h-20 bg-primary/10 backdrop-blur-sm rounded-full shadow-2xl border-4 border-primary flex items-center justify-center animate-float hover:rotate-12 transition-all duration-300 overflow-hidden">

                {/* OPSI 1: Pakai Emoji (Sementara)
                  Jika kamu belum punya file gambarnya, pakai ini dulu.
                */}
                <span className="text-5xl select-none" style={{ filter: "drop-shadow(0px 4px 4px rgba(0,0,0,0.1))" }}>
                    🧕
                </span>

                {/* OPSI 2: Pakai Gambar Desain Aslimu
                  Jika kamu punya file gambar maskotnya (misal: "maskot-cewek.png" di dalam folder public),
                  HAPUS tag <span> emoji di atas, lalu HAPUS TANDA KOMENTAR pada tag <img /> di bawah ini:
                */}
                {/* <img src="/maskot-cewek.png" alt="Maskot CALOLESS" className="w-full h-full object-cover" /> */}

            </div>
        </div>
    );
}