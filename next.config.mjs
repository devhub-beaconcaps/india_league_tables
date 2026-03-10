/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/issuers',
        destination: '/issuers/summary',
        permanent: true, // 301 redirect
      },
    ];
  },

};

export default nextConfig;
