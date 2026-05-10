Project Structure (src/)
src/
├── app/            # App Router (Halaman, API Routes)
├── components/     
│   ├── ui/         # Base components (shadcn/ui)
│   └── shared/     # ProductCard, CartDrawer
├── lib/            
│   ├── supabase/   # Supabase client init
│   └── utils.ts    # Utility (cn, formatRupiah)
├── store/          # Zustand store
└── types/          # Global TS Interfaces
