const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env }) => {
      if (env === 'production') {
        webpackConfig.optimization = webpackConfig.optimization || {};
        // preserve existing minimizer entries if any (react-scripts already adds one)
        const existingMinimizer = webpackConfig.optimization.minimizer || [];
        webpackConfig.optimization.minimizer = [
          // add our terser with drop_console
          new TerserPlugin({
            terserOptions: {
              compress: {
                drop_console: true, // Remove console.* (including console.log)
                // Alternatively, use pure_funcs: ['console.log'] to remove only console.log
              },
            },
          }),
          ...existingMinimizer,
        ];
      }
      return webpackConfig;
    },
  },
};