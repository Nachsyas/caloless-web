import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-zinc-950 text-zinc-300 pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                CALOLESS
              </span>
            </Link>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Inovasi kuliner rendah kalori berbasis kimia pangan. Camilan guilt-free untuk gaya hidup sehatmu.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Pintasan</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-primary transition-colors">Beranda</Link></li>
              <li><Link href="#usp" className="hover:text-primary transition-colors">Keunggulan</Link></li>
              <li><Link href="#katalog" className="hover:text-primary transition-colors">Katalog Produk</Link></li>
              <li><Link href="#tim" className="hover:text-primary transition-colors">Tentang Tim</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Kontak Kami</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0" />
                <span>Kampus 1 UIN Maulana Malik Ibrahim Malang, Jawa Timur</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary shrink-0" />
                <span>+62 838-6260-8826</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <span>halo@caloless.id</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Ikuti Kami</h4>
            {/* PERBAIKAN: Struktur Flexbox yang memisahkan lingkaran ikon dan teks */}
            <div className="flex flex-col gap-4">
              <a href="https://instagram.com/calolesss" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group w-fit">

                {/* Lingkaran Ikon */}
                <div className="w-10 h-10 shrink-0 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-primary group-hover:border-primary text-white transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                </div>

                {/* Teks Handle IG */}
                <span className="text-sm font-medium group-hover:text-primary transition-colors">
                  @calolesss
                </span>

              </a>
            </div>

            <p className="text-xs text-zinc-500 mt-6">
              Dibuat oleh Kelompok 7 Kimia B.
            </p>
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} Caloless. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-white transition-colors">Kebijakan Privasi</Link>
            <Link href="#" className="hover:text-white transition-colors">Syarat & Ketentuan</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}