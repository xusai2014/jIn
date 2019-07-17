"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _webpack = _interopRequireDefault(require("webpack"));

var _webpackDevMiddleware = _interopRequireDefault(require("webpack-dev-middleware"));

process.on('message', function (data) {
  var webpackConfig = data.webpackConfig;
  var _data$middleWareConfi = data.middleWareConfig,
      middleWareConfig = _data$middleWareConfi === void 0 ? {
    publicPath: webpackConfig.output.publicPath,
    onInfo: false //logLevel:'error'

  } : _data$middleWareConfi;
  var compiler = (0, _webpack["default"])(webpackConfig);
  var devMiddleware = (0, _webpackDevMiddleware["default"])(compiler, middleWareConfig);
  process.send(devMiddleware);
});