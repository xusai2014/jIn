"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _webpack = _interopRequireDefault(require("webpack"));

var _webpackDevMiddleware = _interopRequireDefault(require("webpack-dev-middleware"));

var _path = _interopRequireDefault(require("path"));

process.on('message', function (data) {
  try {
    var webpackConfig = data.webpackConfig;

    var config = require(_path["default"].resolve(process.cwd(), webpackConfig));

    var _data$middleWareConfi = data.middleWareConfig,
        middleWareConfig = _data$middleWareConfi === void 0 ? {
      publicPath: config.output.publicPath,
      onInfo: false //logLevel:'error'

    } : _data$middleWareConfi;
    var compiler = (0, _webpack["default"])(config); // compiler.hooks.done.tap('WebpackDevMiddleware', (stats)=>{
    //   console.log(stats,'stats');
    // });

    process.send({
      compiler: compiler,
      middleWareConfig: middleWareConfig
    }); //const devMiddleware = devMiddleWare(compiler, middleWareConfig);
  } catch (e) {
    console.log(e, '紫禁城异常');
  }
});