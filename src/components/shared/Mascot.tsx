"use client";

import { useState, useEffect } from "react";
import Lottie from "lottie-react";
import { toast } from "sonner";
// @ts-ignore
import useSound from "use-sound";

export function Mascot() {
    const [isHovered, setIsHovered] = useState(false);
    const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);

    // State baru untuk menampung data animasi Lottie
    const [lottieData, setLottieData] = useState<any>(null);

    // Hook audio (pastikan file hello.mp3 ada di public/sounds/)
    const [playMascotSound] = useSound("/sounds/hello.mp3");

    // URL animasi Lottie
    const animationUrl = "https://lottie.host/8b51d6db-5431-4171-8bc6-673e4b7899ec/a1z8sXYYF7.json";

    useEffect(() => {
        // 1. Fetch (Download) file JSON Lottie secara dinamis agar TypeScript tidak marah
        fetch(animationUrl)
            .then((res) => res.json())
            .then((data) => setLottieData(data))
            .catch((err) => console.error("Gagal memuat animasi maskot:", err));

        // 2. Memberikan jeda 1.5 detik setelah web load baru menyapa
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
            {/* BALON TEKS SAMBUTAN */}
            {(isHovered || isWelcomeOpen) && (
                <div className="absolute -top-16 left-0 bg-white text-primary font-bold px-4 py-2 rounded-2xl shadow-xl border border-primary/20 animate-bounce whitespace-nowrap text-sm">
                    Welcome to CALOLESS! ✨
                </div>
            )}

            {/* ANIMASI MASKOT */}
            <div className="w-24 h-24 bg-white/80 backdrop-blur-sm rounded-full shadow-2xl border-4 border-primary p-2 flex items-center justify-center">
                {/* Hanya render Lottie jika data JSON sudah berhasil di-download */}
                {lottieData ? (
                    <Lottie
                        animationData={lottieData}
                        loop={true}
                        autoplay={true}
                    />
                ) : (
                    // Animasi loading muter-muter kecil selagi JSON di-download
                    <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                )}
            </div>
        </div>
    );
}