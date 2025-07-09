const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add polyfills for crypto-js
config.resolver.alias = {
  'crypto': 'crypto-browserify',
};

module.exports = config;
