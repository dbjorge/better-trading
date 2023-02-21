/* eslint-env node */

'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');

const IS_TEST_ENVIRONMENT = EmberApp.env() === 'test';

module.exports = function (defaults) {
  const app = new EmberApp(defaults, {
    hinting: false,
    storeConfigInMeta: false,
    tests: IS_TEST_ENVIRONMENT,

    terser: {
      enabled: false,
    },

    vendorFiles: {
      'jquery.js': null,
    },

    autoprefixer: {
      sourcemap: false,
    },

    cssModules: {
      intermediateOutputPath: 'app/styles/_pods.scss',
      extension: 'module.scss',
      postcssOptions: {
        syntax: require('postcss-scss'),
      },
    },

    babel: {
      plugins: [require('ember-auto-import/babel-plugin'), 'transform-object-rest-spread'],
      sourceMaps: 'inline',
    },

    'ember-cli-babel': {
      includePolyfill: true,
    },

    autoImport: {
      // Chromium forbids the use of eval in browser extensions as of Manifest v3.
      // This setting causes ember-auto-import to avoid webpack source map settings
      // which would implicitly use eval in built versions of the app.
      forbidEval: true,

      // This is required to ensure that ember-auto-import produces a single chunk
      // with a consistent name, so we can specify that file in the contentScript
      // section of manfiest.json. In practice, "[name]" is either "app" or "test".
      //
      // See also https://github.com/ef4/ember-auto-import/issues/560
      webpack: {
        output: {
          filename: 'ember-auto-import.[name].js',
          chunkFilename: 'ember-auto-import.[name].js',
        },
        optimization: {
          splitChunks: false,
        },
      },
      miniCssExtractPlugin: {
        filename: 'ember-auto-import.[name].js',
        chunkFilename: 'ember-auto-import.[name].js',
      },
    },

    sourcemaps: {
      enabled: !IS_TEST_ENVIRONMENT,
    },

    fingerprint: {
      enabled: false,
    },
  });

  return app.toTree();
};
