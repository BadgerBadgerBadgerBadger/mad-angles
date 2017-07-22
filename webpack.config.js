'use strict'

const path = require(`path`)
const webpack = require(`webpack`)
const BrowserSyncPlugin = require(`browser-sync-webpack-plugin`)

const phaserModule = path.join(__dirname, `/node_modules/phaser/`)
const phaser = path.join(phaserModule, `build/custom/phaser-split.js`)
const pixi = path.join(phaserModule, `build/custom/pixi.js`)
const p2 = path.join(phaserModule, `build/custom/p2.js`)

const definePlugin = new webpack.DefinePlugin({
  __DEV__: JSON.stringify(JSON.parse(process.env.BUILD_DEV || 'true'))
})

module.exports = {
  entry: {
    app: [
      'babel-polyfill',
      path.resolve(__dirname, 'src/index.ts')
    ],
    vendor: ['pixi', 'p2', 'phaser', 'lodash']
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: './dist/',
    filename: 'bundle.js'
  },
  plugins: [
    definePlugin,
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor'/* chunkName= */,
      filename: 'vendor.bundle.js'/* filename= */
    }),
    new BrowserSyncPlugin({
      host: process.env.IP || 'localhost',
      port: process.env.PORT || 3000,
      server: {
        baseDir: ['./', './build']
      }
    })
  ],

  module: {
    rules: [
      {test: /\.js$/, use: ['babel-loader'], include: path.join(__dirname, 'src')},
      {test: /\.ts?$/, use: 'ts-loader', exclude: /node_modules/},
      {test: /pixi\.js/, use: ['expose-loader?PIXI']},
      {test: /phaser-split\.js$/, use: ['expose-loader?Phaser']},
      {test: /p2\.js/, use: ['expose-loader?p2']}
    ]
  },
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  },
  resolve: {
    alias: {
      'phaser': phaser,
      'pixi': pixi,
      'p2': p2
    }
  },
  watch: true
}
