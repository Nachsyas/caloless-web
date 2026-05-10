import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

export async function AboutTeam() {
  const supabase = await createClient();
  const { data: team } = await supabase
    .from("team_members")
    .select("*")
    .order("order_priority")
    .limit(4);

  return (
    <section id="tim" className="py-24 bg-secondary/50 dark:bg-secondary/10 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Tim di Balik Caloless</h2>
          <p className="text-lg text-muted-foreground">
            Diinisiasi oleh Kelompok 7 Kimia B UIN Maulana Malik Ibrahim Malang. Kami berdedikasi menciptakan inovasi kuliner yang menyehatkan.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {team?.map((member) => (
            <div key={member.id} className="flex flex-col items-center group text-center">
              <div className="relative w-40 h-40 mb-6 rounded-full overflow-hidden border-4 border-white dark:border-zinc-900 shadow-xl group-hover:scale-105 group-hover:border-primary/50 transition-all duration-300">
                <Image 
                  src={member.photo_url || "/team-1.png"} 
                  alt={member.name}
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              </div>
              <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors">{member.name}</h3>
              <p className="text-sm font-medium text-primary px-3 py-1 bg-primary/10 rounded-full">{member.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
