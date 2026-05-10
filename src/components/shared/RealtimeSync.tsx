"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function RealtimeSync() {
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        // Mendengarkan perubahan pada tabel products
        const productChannel = supabase.channel('public:products')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
                toast.info("Update dari Admin: Data Menu baru saja diperbarui!");
                router.refresh(); // Memaksa Next.js memuat ulang data tanpa refresh halaman (Seamless)
            })
            .subscribe();

        // Mendengarkan perubahan pada tabel team_members
        const teamChannel = supabase.channel('public:team_members')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, () => {
                router.refresh();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(productChannel);
            supabase.removeChannel(teamChannel);
        };
    }, [router, supabase]);

    return null; // Komponen ini invisible (tidak merender UI apa pun)
}