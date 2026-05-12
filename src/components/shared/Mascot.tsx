"use client";

import { useState, useEffect } from "react";
import Lottie from "lottie-react";
import { toast } from "sonner";
import useSound from "use-sound";

export function Mascot() {
    const [isHovered, setIsHovered] = useState(false);
    const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);

    // Hook audio (pastikan file hello.mp3 ada di public/sounds/)
    const [playMascotSound] = useSound("/sounds/hello.mp3");

    // URL animasi Lottie
    const animationUrl = "https://lottie.host/8b51d6db-5431-4171-8bc6-673e4b7899ec/a1z8sXYYF7.json";

    // EFEK SAMBUTAN OTOMATIS SAAT WEB DIBUKA
    useEffect(() => {
        // Memberikan jeda 1.5 detik setelah web load baru menyapa
        const timer = setTimeout(() => {
            setIsWelcomeOpen(true);

            toast("✨ Selamat Datang di CALOLESS!", {
                description: "Halo! Aku asisten sehatmu. Mau cari camilan rendah kalori apa hari ini?",
                duration: 5000,
            });

            // Catatan: playMascotSound() mungkin diblokir browser jika belum ada interaksi user.
            // Jadi suara paling aman dipicu lewat klik.
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    const handleMascotClick = () => {
        playMascotSound();
        setIsWelcomeOpen(false); // Tutup balon sapaan otomatis jika sudah di-klik

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
            {/* BALON TEKS SAMBUTAN (Muncul otomatis saat baru buka web) */}
            {(isHovered || isWelcomeOpen) && (
                <div className="absolute -top-16 left-0 bg-white text-primary font-bold px-4 py-2 rounded-2xl shadow-xl border border-primary/20 animate-bounce whitespace-nowrap text-sm">
                    Welcome to CALOLESS! ✨
                </div>
            )}

            {/* ANIMASI MASKOT */}
            <div className="w-24 h-24 bg-white/80 backdrop-blur-sm rounded-full shadow-2xl border-4 border-primary p-2">
                <Lottie
                    animationData={null}
                    path={animationUrl}
                    loop={true}
                    autoplay={true}
                />
            </div>
        </div>
    );
}