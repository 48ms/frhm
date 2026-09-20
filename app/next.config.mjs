/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { dev }) => {
    // Disable eval source maps completely to fix Next.js Edge Runtime bug on Windows
    config.devtool = false;
    config.plugins = config.plugins.filter(
      (p) => !p.constructor || !p.constructor.name.includes('EvalSourceMap')
    );
    
    return config;
  },
};

export default nextConfig;