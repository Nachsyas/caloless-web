"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
// @ts-ignore
import useSound from "use-sound";

export function Mascot() {
    const [isHovered, setIsHovered] = useState(false);
    const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);

    // Hook audio (Pastikan file hello.mp3 ada di public/sounds/)
    const [playMascotSound] = useSound("/sounds/hello.mp3");

    // EFEK SAMBUTAN OTOMATIS SAAT WEB DIBUKA
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
            {/* CSS Animasi Mengambang (Floating Effect) */}
            <style dangerouslySetInnerHTML={{
                __html: `
              @keyframes float {
                0% { transform: translateY(0px); }
                50% { transform: translateY(-15px); }
                100% { transform: translateY(0px); }
              }
              .animate-mascot-float {
                animation: float 4s ease-in-out infinite;
              }
            `}} />

            {/* BALON TEKS SAMBUTAN */}
            {(isHovered || isWelcomeOpen) && (
                <div className="absolute -top-16 left-0 bg-white text-primary font-bold px-4 py-2 rounded-2xl shadow-xl border border-primary/20 animate-bounce whitespace-nowrap text-sm">
                    Welcome to CALOLESS! ✨
                </div>
            )}

            {/* KONTINER MASKOT (Menggunakan Foto team-1.png) */}
            <div className="w-24 h-24 bg-white/90 backdrop-blur-sm rounded-full shadow-2xl border-4 border-primary overflow-hidden animate-mascot-float transition-all duration-300 hover:rotate-6">
                <img
                    src="/team-1.png"
                    alt="Mascot CALOLESS"
                    className="w-full h-full object-cover"
                />
            </div>
        </div>
    );
}