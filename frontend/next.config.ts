import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Turbopack configuration (Next.js 16+ default bundler)
  turbopack: {
    resolveAlias: {
      // Alias React Native modules to empty modules (MetaMask SDK fix)
      '@react-native-async-storage/async-storage': { browser: '' },
      'react-native': { browser: '' },
    },
  },

  // Webpack configuration for web3 compatibility (fallback if using --webpack)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Fallbacks for Node.js modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        buffer: false,
        events: false,
        util: false,
      };

      // Alias React Native modules to empty modules (MetaMask SDK fix)
      config.resolve.alias = {
        ...config.resolve.alias,
        '@react-native-async-storage/async-storage': false,
        'react-native': false,
      };
    }

    // Ignore warnings from problematic packages
    config.ignoreWarnings = [
      { module: /node_modules\/punycode/ },
      { module: /node_modules\/@privy-io/ },
      { module: /node_modules\/@metamask/ },
      
    ];

    return config;
  },

  // Transpile packages
  transpilePackages: [
    '@privy-io/react-auth',
    '@privy-io/wagmi',
  ],

  reactStrictMode: true,

  // Disable image optimization for local dev
  images: {
    unoptimized: true,
  },
};

export default nextConfig;