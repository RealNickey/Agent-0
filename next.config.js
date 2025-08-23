/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // No experimental flags set. Avoid modifying `experimental` to prevent
  // module resolution issues during Next.js builds.
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
        canvas: false,
      };
    }

    // Prefer browser build of vega-canvas; some deps reference the node variant explicitly
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "vega-canvas/build/vega-canvas.node.module.js": require.resolve(
        "vega-canvas/build/vega-canvas.browser.module.js"
      ),
      "vega-canvas": require.resolve(
        "vega-canvas/build/vega-canvas.browser.module.js"
      ),
    };

    // Handle worklet files
    config.module.rules.push({
      test: /\.worklet\.(js|ts)$/,
      type: "asset/resource",
    });

    return config;
  },
};

module.exports = nextConfig;
