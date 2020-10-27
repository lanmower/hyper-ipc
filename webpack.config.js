const path = require('path');

module.exports = {
  target:'node',
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve('dist'),
    filename: 'index.js',
    libraryTarget: 'commonjs2',
    library: 'hyperrpc',
  },
  module: {
    rules: [
      {
        test: /\.js?$/,
        exclude: /(node_modules)/,
        use: 'babel-loader',
      },
    ],
  },
  resolve: {
    extensions: ['.js'],
    fallback: {
      "util": false,
      "dns": false,
      "path": false,
      "buffer": false,
      "os": false,
      "buffer": false
    }
  },
};