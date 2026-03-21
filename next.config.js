/** @type {import('next').NextConfig} */
const nextConfig = {
  // Include kuromoji dictionary files in serverless function output
  experimental: {
    outputFileTracingIncludes: {
      '/api/database/v2/sets/auto-categorize': [
        'node_modules/kuromoji/dict/**',
      ],
      '/api/practice/conjugation/generate': ['node_modules/kuromoji/dict/**'],
    },
  },
  webpack: (config, { isServer }) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    config.output.webassemblyModuleFilename = isServer
      ? '../static/wasm/[modulehash].wasm'
      : 'static/wasm/[modulehash].wasm';

    // Handle Node.js modules that might be imported but not available in browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    return config;
  },
};

module.exports = nextConfig;
