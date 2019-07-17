"use strict";

var _interopRequireWildcard3 = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.start = start;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _interopRequireWildcard2 = _interopRequireDefault(require("@babel/runtime/helpers/interopRequireWildcard"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _express = _interopRequireDefault(require("express"));

var _print = _interopRequireDefault(require("./print"));

var _webpack = _interopRequireDefault(require("webpack"));

var _webpackDevMiddleware = _interopRequireDefault(require("webpack-dev-middleware"));

var _default = _interopRequireDefault(require("./config/default"));

var _child_process = _interopRequireWildcard3(require("child_process"));

var _path = _interopRequireDefault(require("path"));

var _os = _interopRequireDefault(require("os"));

var _fs = _interopRequireDefault(require("fs"));

var app = (0, _express["default"])();

function start(port, configPath) {
  if (port > 1000) {
    app.listen(port, function () {
      ready(app, configPath);

      _print["default"].log('成功启动！💪', port);

      openUrl("http://localhost:".concat(port));
    });
  } else {
    _print["default"].log('端口异常，必须大于1000', port);
  }
}

function ready(_x, _x2) {
  return _ready.apply(this, arguments);
}

function _ready() {
  _ready = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee(app, configPath) {
    var clientConfig, serverConfig, clientWorker, serverWorker;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (!_fs["default"].existsSync(configPath)) {
              _context.next = 10;
              break;
            }

            console.log(_path["default"].resolve(process.cwd(), "".concat(configPath, "/webpack.client.config.js")));
            _context.next = 4;
            return Promise.resolve().then(function () {
              return (0, _interopRequireWildcard2["default"])(require("".concat(_path["default"].resolve(process.cwd(), "".concat(configPath, "/webpack.client.config.js")))));
            });

          case 4:
            clientConfig = _context.sent;
            _context.next = 7;
            return Promise.resolve().then(function () {
              return (0, _interopRequireWildcard2["default"])(require("".concat(_path["default"].resolve(process.cwd(), "".concat(configPath, "/webpack.server.config.js")))));
            });

          case 7:
            serverConfig = _context.sent;
            _context.next = 12;
            break;

          case 10:
            clientConfig = (0, _default["default"])('development', 'client', 2);
            serverConfig = (0, _default["default"])('development', 'client', 2);

          case 12:
            if (_os["default"].cpus().length <= 2) {
              clientWorker = _child_process["default"].fork(_path["default"].join(__dirname, './config/client-worker.js'));
              clientWorker.send({
                webpackConfig: clientConfig
              });
              clientWorker.on('message', function (clientMiddleware) {
                app.use(clientMiddleware);
              });
              serverWorker = _child_process["default"].fork(_path["default"].join(__dirname, './config/client-worker.js'));
              serverWorker.send({
                webpackConfig: serverConfig
              });
              serverWorker.on('message', function (serverMiddleware) {
                app.use(serverMiddleware);
              });
            } else {
              initMiddleWare(app, {
                webpackConfig: clientConfig
              });
              initMiddleWare(app, {
                webpackConfig: serverConfig
              });
            }

          case 13:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _ready.apply(this, arguments);
}

function initMiddleWare(app, data) {
  // 获取webpack配置信息及devMiddleWare配置信息
  var webpackConfig = data.webpackConfig;
  var _data$middleWareConfi = data.middleWareConfig,
      middleWareConfig = _data$middleWareConfi === void 0 ? {
    publicPath: webpackConfig.output.publicPath,
    onInfo: false //logLevel:'error'

  } : _data$middleWareConfi;
  console.log('webpackConfig', webpackConfig);
  var compiler = (0, _webpack["default"])(webpackConfig);
  var devMiddleware = (0, _webpackDevMiddleware["default"])(compiler, middleWareConfig);
  app.use(devMiddleware);
}

function openUrl(url) {
  // 拿到当前系统的参数
  switch (process.platform) {
    //mac系统使用 一下命令打开url在浏览器
    case "darwin":
      (0, _child_process.exec)("open ".concat(url));
    //win系统使用 一下命令打开url在浏览器

    case "win32":
      (0, _child_process.exec)("start ".concat(url));
    // 默认mac系统

    default:
      (0, _child_process.exec)("open ".concat(url));
  }
}