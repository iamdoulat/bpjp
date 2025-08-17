
import type {NextConfig} from 'next';
import WithPWAInit from '@ducanh2912/next-pwa';

const withPWA = WithPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true, // Explicitly set to true
  skipWaiting: true, // Recommended for smoother updates
  cacheOnFrontEndNav: true, // Cache pages navigated to on the client
  reloadOnOnline: true, // Reload the app when it comes back online
});

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default withPWA(nextConfig);
