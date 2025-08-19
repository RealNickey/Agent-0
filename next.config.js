/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    esmExternals: true,
    appDir: false, // Disable App Router since we are using Pages Router with Clerk auth
  },
  sassOptions: {
    includePaths: ["./src"],
  },
  env: {
    REACT_APP_GEMINI_API_KEY: process.env.REACT_APP_GEMINI_API_KEY,
  },
  // Handle audio worklets and other assets
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    // Handle worklet files
    config.module.rules.push({
      test: /\.worklet\.(js|ts)$/,
      use: {
        loader: "workbox-webpack-plugin",
      },
    });

    return config;
  },
};

module.exports = nextConfig;
