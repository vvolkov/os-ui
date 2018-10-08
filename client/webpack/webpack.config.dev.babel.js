const common = require('./webpack.config.common')
const { resolve } = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const devMode = true

const page = process.env.page
const noReact = "true" == process.env.noReact 

module.exports = {
  mode: 'development',
  entry: {
    main: [!!page && page != "default"  
    ? resolve(__dirname, `../src/landing-pages/${page}/main.tsx`) 
    : resolve(__dirname, 'hotReload'),]
  },
  externals: common.externals,
  output: {
    filename: 'bundle.js',
    path: resolve(__dirname),
    publicPath: '/',
  },
  context: resolve(__dirname, '../src'),
  resolve: common.resolve,
  devtool: 'inline-source-map',
  devServer: {
    hot: true,
    host: '127.0.0.1',
    contentBase: resolve(__dirname, '../assets'),
    publicPath: '/',
    historyApiFallback: true,
    proxy: {
      '/api/*': {
        target: 'http://127.0.0.1:3081/', // 'https://api.ipify.org/',
        changeOrigin: true,
        ws: true,
      }
    },
    historyApiFallback: {
      disableDotRule: true
    }
  },
  module: {
    rules: [
      common.modules.purs,
      common.modules.ts,
      {
        test: /\.styl$/,
        oneOf: [{
          resourceQuery: /^\?raw$/,
          use: [
            'css-hot-loader',
            'style-loader',
            'css-loader',
            common.loaders.postcss,
            common.loaders.stylus,
          ]
        }, {
          use: [
            'css-hot-loader',
            'style-loader',
            common.loaders["typings-for-css-camelCase"],
            common.loaders.postcss,
            common.loaders.stylus
          ]
        }]
      },
      {
        test: /\.(css|less)$/,
        oneOf: [{
          resourceQuery: /^\?raw$/,
          use: [
            'css-hot-loader',
            'style-loader',
            'css-loader',
            common.loaders.postcss,
            common.loaders.less,
          ]
        }, {
          resourceQuery: /^\?dash-case$/,
          use: [
            'css-hot-loader',
            'style-loader',
            common.loaders["typings-for-css"],
            common.loaders.postcss,
            common.loaders.less,
          ]
        }, {
          use: [
            'css-hot-loader',
            'style-loader',
            common.loaders["typings-for-css-camelCase"],
            common.loaders.postcss,
            common.loaders.less,
          ]
        }]
      },
      common.modules.url,
    ],
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NamedModulesPlugin(),
    // new MiniCssExtractPlugin('style.css'),
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: devMode ? '[name].css' : '[name].[hash].css',
      chunkFilename: devMode ? '[id].css' : '[id].[hash].css',
    }),
    new HtmlWebpackPlugin({
      title: process.env.page,
      template: "true" == process.env.html ? `../src/landing-pages/${page}/template.html` : '../webpack/template.html',
    }),
    common.plugins.define
  ],
  performance: { hints: false },
}
