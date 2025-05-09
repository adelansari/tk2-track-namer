import type {NextConfig} from 'next';

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  output: 'export',
  basePath: isProd ? "/tk2-track-namer" : "",
  assetPrefix: isProd ? "/tk2-track-namer/" : "",

};

export default nextConfig;
