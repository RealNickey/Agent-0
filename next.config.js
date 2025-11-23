/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // No experimental flags set. Avoid modifying `experimental` to prevent
  // module resolution issues during Next.js builds.
  env: {
    REACT_APP_GEMINI_API_KEY: process.env.REACT_APP_GEMINI_API_KEY,
  },
  // Fix TypeScript path resolution issues
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors. This is a temporary fix for Next.js 15.5.0 validator issues
    ignoreBuildErrors: true,
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
    // Resolve the browser build path from the package.json's "exports" so we
    // can point aliases at a concrete file path (avoids using unsupported
    // require.resolve({ conditions: [...] }) in some Node environments).
    const path = require("path");
    let vegaBrowserEntry;
    try {
      const vegaPkg = require("vega-canvas/package.json");
      const pkgDir = path.dirname(require.resolve("vega-canvas/package.json"));
      // prefer exports.default -> fallback to build/vega-canvas.browser.js
      const exported = vegaPkg.exports && vegaPkg.exports.default;
      vegaBrowserEntry = path.join(pkgDir, (exported || "./build/vega-canvas.browser.js").replace(/^\.\//, ""));
    } catch (e) {
      // Fallback to the conventional file path
      vegaBrowserEntry = path.join(process.cwd(), "node_modules", "vega-canvas", "build", "vega-canvas.browser.js");
    }
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // The vega-canvas package exposes ./build/vega-canvas.browser.js via
      // its "exports" field. The previous alias pointed at
      // build/vega-canvas.browser.module.js which isn't exported and causes
      // a package subpath error during Next.js builds. Point the aliases at
      // the exported browser build instead to be compatible with the package
      // exports map.
      // Map any references to vega-canvas directly to the package's exported
      // entry so webpack will resolve the correct browser build through the
      // package's "exports" map instead of referencing non-exported
      // subpaths. Some upstream packages still import the node build
      // (build/vega-canvas.node.js) explicitly — alias that as well so the
      // browser build is used during client bundling and we avoid warnings
      // about top-level await / missing native 'canvas' bindings.
      // Resolve vega-canvas for the browser condition so we get the
      // browser-optimized build instead of the node entry which expects
      // native 'canvas' bindings. require.resolve supports the 'conditions'
      // option which causes the package's exports to be resolved with the
      // 'browser' condition where available.
      "vega-canvas/build/vega-canvas.node.js": vegaBrowserEntry,
      "vega-canvas": vegaBrowserEntry,
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
