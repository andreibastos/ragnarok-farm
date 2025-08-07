const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    main: './src/js/main.js',
    dashboard: './src/js/dashboard.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html',
      chunks: [],
      inject: false,
    }),
    new HtmlWebpackPlugin({
      template: './src/create-farm.html',
      filename: 'create-farm.html',
      chunks: ['main'],
      inject: false,
    }),
    new HtmlWebpackPlugin({
      template: './src/dashboard.html',
      filename: 'dashboard.html',
      chunks: ['dashboard'],
      inject: false,
    }),
    new CopyPlugin({
      patterns: [
        { 
          from: './src/css', 
          to: 'css',
          noErrorOnMissing: true 
        },
      ],
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 3001,
    open: true,
    hot: true,
  },
  resolve: {
    extensions: ['.js'],
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          filename: 'vendors.bundle.js',
        },
      },
    },
  },
};
