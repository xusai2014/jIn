"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.start = start;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _express = _interopRequireDefault(require("express"));

var _print = _interopRequireDefault(require("./print"));

var _webpack = _interopRequireDefault(require("webpack"));

var _webpackDevMiddleware = _interopRequireDefault(require("webpack-dev-middleware"));

var _default = _interopRequireDefault(require("./config/default"));

var _child_process = _interopRequireWildcard(require("child_process"));

var _path = _interopRequireDefault(require("path"));

var _os = _interopRequireDefault(require("os"));

var _fs = _interopRequireDefault(require("fs"));

var app = (0, _express["default"])(); // 热开发打包文件并加入内存

function ready(_x, _x2) {
  return _ready.apply(this, arguments);
}

function _ready() {
  _ready = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee(app, configPath) {
    var clientWorker, serverWorker, clientConfig, serverConfig;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            // 选择性 使用多任务方式处理打包任务
            if (_os["default"].cpus().length >= 2) {
              clientWorker = _child_process["default"].fork(_path["default"].join(__dirname, './config/client-worker.js'));
              clientWorker.send({
                webpackConfig: "".concat(configPath, "/webpack.client.config.js")
              });
              clientWorker.on('message', function (clientMiddleware) {
                console.log(clientWorker, '1111');
              });
              serverWorker = _child_process["default"].fork(_path["default"].join(__dirname, './config/client-worker.js'));
              serverWorker.send({
                webpackConfig: "".concat(configPath, "/webpack.server.config.js")
              });
              serverWorker.on('message', function (serverMiddleware) {
                console.log(serverWorker, '1111');
              });
              process.on('SIGINT', function () {
                console.log('手动终止了进程');
                clientWorker.kill();
                serverWorker.kill();
                process.exit();
              });
              process.on('uncaughtException', function (code) {
                console.log("\u9000\u51FA\u7801: ".concat(code));
                clientWorker.kill();
                serverWorker.kill();
                process.exit();
              });
            } else {
              if (_fs["default"].existsSync(configPath)) {
                // import 动态引入需要侵入被引用框架处理，require().default问题，目前尚未在工具端找到解决方案
                // clientConfig = await import(path.resolve(process.cwd(),`${configPath}/webpack.client.config.js`));
                // serverConfig = await import(path.resolve(process.cwd(),`${configPath}/webpack.server.config.js`));
                clientConfig = require(_path["default"].resolve(process.cwd(), "".concat(configPath, "/webpack.client.config.js")));
                serverConfig = require(_path["default"].resolve(process.cwd(), "".concat(configPath, "/webpack.server.config.js")));
              } else {
                clientConfig = (0, _default["default"])('development', 'client', 2);
                serverConfig = (0, _default["default"])('development', 'client', 2);
              }

              initMiddleWare(app, {
                webpackConfig: clientConfig
              });
              initMiddleWare(app, {
                webpackConfig: serverConfig
              });
            }

          case 1:
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
} // 启动监听服务，并做好热开发打包文件加载进入内存


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