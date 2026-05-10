/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co', // Izin untuk foto dummy
      },
      {
        protocol: 'https',
        hostname: 'dfndpcqwxzaswpwbnxjt.supabase.co', // Izin untuk foto asli dari Supabase-mu
      },
    ],
  },
  // Tambahan agar bisa upload foto produk yang resolusinya besar (maksimal 5MB)
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
};

export default nextConfig;