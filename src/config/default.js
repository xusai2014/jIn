import path from 'path';
import {
  preLoader
} from './pack'

/**
 *   @author jerryxu
 *   @methodName Generate webpack config file
 *   @param { String } mode 模式development或者production
 *   @param { String } runtime 运行环境client或者server
 *   @param { Number } 项目规模 区分从用不同消耗资源打包方案 1 小项目 2 大项目
 *   @description
 */


export default function GeneratePack(mode, runtime, level) {

  function isDevelopment() {// 是否是开发者模式还是生产模式
    return mode !== 'development';
  }

  function isClient() { // 运行环境是客户端还是服务端
    return runtime !== 'client';
  }
  const preCfg = level > 1 ? preLoader : [];

  return {
    mode,
    devtool: isDevelopment ? false : '#source-map',
    output: {
      path: path.resolve(__dirname, '../dist'),
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
      rules: [
        {
          test: /\.vue$/,
          use: preCfg.concat([
            {
              loader: 'vue-loader',
              options: {
                compilerOptions: {
                  preserveWhitespace: false
                }
              }
            }
          ]),
        },
        {
          test: /\.(js|jsx)$/,
          use: [
            ...preCfg,
            'babel-loader?cacheDirectory=true'],
          exclude: /node_modules/
        },
        {
          test: /\.(png|jpg|gif|svg)$/,
          loader: 'url-loader',
          options: {
            limit: 2000,
            name: 'images/[name].[ext]?[hash]'
          }
        }
      ]
    },
    performance: {
      maxEntrypointSize: 300000,
      hints: isDevelopment() ? 'warning' : false
    },
  }
}