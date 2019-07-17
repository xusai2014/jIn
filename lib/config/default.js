"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = GeneratePack;

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _path = _interopRequireDefault(require("path"));

var _pack = require("./pack");

/**
 *   @author jerryxu
 *   @methodName Generate webpack config file
 *   @param { String } mode 模式development或者production
 *   @param { String } runtime 运行环境client或者server
 *   @param { Number } 项目规模 区分从用不同消耗资源打包方案 1 小项目 2 大项目
 *   @description
 */
function GeneratePack(mode, runtime, level) {
  function isDevelopment() {
    // 是否是开发者模式还是生产模式
    return mode !== 'development';
  }

  function isClient() {
    // 运行环境是客户端还是服务端
    return runtime !== 'client';
  }

  var preCfg = level > 1 ? _pack.preLoader : [];
  return {
    mode: mode,
    devtool: isDevelopment ? false : '#source-map',
    output: {
      path: _path["default"].resolve(__dirname, '../dist'),
      publicPath: '/',
      filename: '[name].[chunkhash].js'
    },
    target: isClient ? 'web' : 'node',
    stats: 'errors-only',
    resolve: {
      extensions: ['.js', '.vue', '.jsx']
    },
    module: {
      noParse: /es6-promise\.js$/,
      rules: [{
        test: /\.vue$/,
        use: preCfg.concat([{
          loader: 'vue-loader',
          options: {
            compilerOptions: {
              preserveWhitespace: false
            }
          }
        }])
      }, {
        test: /\.(js|jsx)$/,
        use: [].concat((0, _toConsumableArray2["default"])(preCfg), ['babel-loader?cacheDirectory=true']),
        exclude: /node_modules/
      }, {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'url-loader',
        options: {
          limit: 2000,
          name: 'images/[name].[ext]?[hash]'
        }
      }]
    },
    performance: {
      maxEntrypointSize: 300000,
      hints: isDevelopment() ? 'warning' : false
    }
  };
}