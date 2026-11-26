const host = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : '*.supabase.co'
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns: [{ protocol: 'https', hostname: host }, { protocol: 'https', hostname: '*.supabase.co' }] },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
}
export default nextConfig
