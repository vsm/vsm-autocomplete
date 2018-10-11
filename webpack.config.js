/*
For a clean reinstall:
delete 'package-lock.json', empty 'package.json'`s dev/Dependencies, and run:
npm i -D \
  webpack  webpack-dev-server  webpack-cli \
  style-loader  css-loader  null-loader \
  html-webpack-plugin  text-transform-loader \
  babel-loader  @babel/core  @babel/preset-env \
  vue  vue-loader  vue-template-compiler  @vue/test-utils \
  document-register-element  vue-custom-element \
  mocha  mocha-webpack@^2.0.0-beta.0  sinon  webpack-node-externals \
  jsdom  jsdom-global  chai \
  eslint  eslint-loader  eslint-plugin-vue \
  stylelint  stylelint-webpack-plugin \
  stylelint-config-standard  stylelint-config-recess-order \
  opn-cli  npm-run-all \
  vsm-dictionary-local  vsm-dictionary-cacher ;\
npm i -P \
  string-style-html
*/


const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const StylelintPlugin = require('stylelint-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const nodeExternals = require('webpack-node-externals');

const src  = path.resolve(__dirname, './src');


module.exports = (env = {}) => {

  var DEV      = env.NODE_ENV == 'development';
  var TEST     = env.NODE_ENV == 'testing';


  return Object.assign(

    { mode: DEV ? 'development' : TEST ? 'production' : 'none' },


    DEV ? {
      devServer: {
        port: 3000,
        open: true,
        contentBase: src,
        watchContentBase: true
      },

      entry: src + '/index-dev.js'
    } : {},


    {
      devtool: DEV  ? 'inline-source-map' :
               TEST ? 'inline-cheap-module-source-map' : false,

      module: {
        rules: [
          {
            test: /\.(js|vue)$/,
            exclude: /node_modules/,
            enforce: 'pre',
            loader: 'eslint-loader',
            options: {  // These override '.estlintrc' options.
              emitWarning: true  // Make errors not abort the build.
            }
          },
          {
            test: /\.vue$/,
            loader: 'vue-loader'
          },
          {
            test: /\.js$/,
            include: src,
            exclude: /node_modules/,
            use: [
              {
                loader: 'babel-loader',
                options: { presets: ['@babel/preset-env'] }
              },
              {
                loader: 'text-transform-loader',
                options: {
                  transformText: s =>
                    // Exclude this VsmDictionary dependency, for use in browser:
                    s.replace(/require\('xmlhttprequest'\)/g, '{}')
                }
              }
            ]
          },
          Object.assign( { test: /\.css$/ },
            TEST ? { loader: 'null-loader'} :
                   { use: ['style-loader', 'css-loader'] }
          )
        ]
      },

      resolve: {
        extensions: ['.js', '.vue'],
        alias: DEV ? {  // Do not use the default 'vue.runtime.js' during dev:
          'vue$': 'vue/dist/vue.js'  // -> this enables informative warning msgs.
        } : {}
      },

      node: {
        fs: 'empty',
        child_process: 'empty'
      },

      externals: TEST ? [nodeExternals()] : {},

      plugins:
        [ new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(env.NODE_ENV)
          }),
          new VueLoaderPlugin()
        ]
        .concat( DEV ?
          [ new HtmlWebpackPlugin({
              template: src + '/index-dev.html',
              inject: 'body'
            }),
            new StylelintPlugin({ files: ['src/**/*.vue'] })
          ] : []
        ),

      output: Object.assign(
        !TEST ? {
          filename: 'vsm-autocomplete.js',
        } : {},
        TEST ? {  // As recommended on https://vue-test-utils.vuejs.org
          devtoolModuleFilenameTemplate: '[absolute-resource-path]',
          devtoolFallbackModuleFilenameTemplate: '[absolute-resource-path]?[hash]'
        } : {}
      )
    }
  );
}
