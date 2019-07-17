// let webpackConfig = {
//   mode: 'development',
//   devtool: '#source-map',
//   output: {
//     path: '/Users/jerryxu/lyProject/tc-flight-kylin/dist',
//     publicPath: '/',
//     filename: '[name].[chunkhash].js'
//   },
//   stats: 'errors-only',
//   resolve: {
//     alias:
//       {
//         '@': '/Users/jerryxu/lyProject/tc-flight-kylin/src',
//         channel:
//           '/Users/jerryxu/lyProject/tc-flight-kylin/src/channels/kylinwechat',
//         build: '/Users/jerryxu/lyProject/tc-flight-kylin/build',
//         '@router':
//           '/Users/jerryxu/lyProject/tc-flight-kylin/src/router/allrouter.js'
//       },
//     extensions: ['.js', '.vue']
//   },
//   module: {
//     noParse: /es6-promise\.js$/,
//     rules: [[Object], [Object], [Object], [Object]]
//   },
//   performance: {maxEntrypointSize: 300000, hints: false},
//   plugins:
//     [VueLoaderPlugin {},
//       DefinePlugin {definitions: [Object]},
//       ProgressPlugin {
//       profile: false,
//       handler: [Function],
//       modulesCount: 500,
//       showEntries: false,
//       showModules: true,
//       showActiveModules: true
//     },
//       FriendlyErrorsWebpackPlugin {
//       compilationSuccessInfo: {},
//       onErrors: undefined,
//       shouldClearConsole: true,
//       formatters: [Array],
//       transformers: [Array]
//     },
//       DefinePlugin {definitions: [Object]},
//       BundleAnalyzerPlugin {opts: [Object], server: null, logger: [Logger]},
//       DllReferencePlugin {options: [Object]},
//       MiniCssExtractPlugin {options: [Object]},
//       VueSSRClientPlugin {options: [Object]}],
//   entry:
//     {
//       utils:
//         ['./src/mixins/index.js',
//           './src/common/dateUtils.js',
//           './src/common/utils.js',
//           './src/services/index.js'],
//       widgets: './src/components/widgets/index.js',
//       app: './src/entry-client.js'
//     },
//   optimization:
//     {
//       minimizer: [[OptimizeCssAssetsWebpackPlugin]],
//       splitChunks:
//         {
//           chunks: 'async',
//           minSize: 30000,
//           minChunks: 1,
//           maxAsyncRequests: 5,
//           maxInitialRequests: 3,
//           name: false,
//           cacheGroups: [Object]
//         }
//     },
//   default:
//     {
//       mode: 'development',
//       devtool: '#source-map',
//       output:
//         {
//           path: '/Users/jerryxu/lyProject/tc-flight-kylin/dist',
//           publicPath: '/',
//           filename: '[name].[chunkhash].js'
//         },
//       stats: 'errors-only',
//       resolve: {alias: [Object], extensions: [Array]},
//       module: {noParse: /es6-promise\.js$/, rules: [Array]},
//       performance: {maxEntrypointSize: 300000, hints: false},
//       plugins:
//         [VueLoaderPlugin {},
//           [DefinePlugin],
//           [ProgressPlugin],
//           [FriendlyErrorsWebpackPlugin],
//           [DefinePlugin],
//           [BundleAnalyzerPlugin],
//           [DllReferencePlugin],
//           [MiniCssExtractPlugin],
//           [VueSSRClientPlugin]],
//       entry:
//         {
//           utils: [Array],
//           widgets: './src/components/widgets/index.js',
//           app: './src/entry-client.js'
//         },
//       optimization: {minimizer: [Array], splitChunks: [Object]}
//     }
// }
"use strict";