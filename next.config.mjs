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
      {
        source: '/analysis',
        destination: '/heatmap',
        permanent: true, // 301 redirect
      },
      {
        source: '/arrangers',
        destination: '/arrangers/summary',
        permanent: true, // 301 redirect
      },
      {
        source: '/trustees',
        destination: '/trustees/summary',
        permanent: true, // 301 redirect
      },
      {
        source: '/registrars',
        destination: '/registrars/summary',
        permanent: true, // 301 redirect
      },
      {
        source: '/agencies',
        destination: '/agencies/summary',
        permanent: true, // 301 redirect
      },
    ];
  },

};

export default nextConfig;
