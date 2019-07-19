"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.start = start;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _express = _interopRequireDefault(require("express"));

var _print = _interopRequireDefault(require("./print"));

var _webpack = _interopRequireDefault(require("webpack"));

var _webpackDevMiddleware = _interopRequireDefault(require("webpack-dev-middleware"));

var _default = _interopRequireDefault(require("./config/default"));

var _child_process = _interopRequireWildcard(require("child_process"));

var _path = _interopRequireDefault(require("path"));

var _os = _interopRequireDefault(require("os"));

var _fs = _interopRequireDefault(require("fs"));

var _webpackHotMiddleware = _interopRequireDefault(require("webpack-hot-middleware"));

var _chokidar = _interopRequireDefault(require("chokidar"));

var _happypack = _interopRequireDefault(require("happypack"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { keys.push.apply(keys, Object.getOwnPropertySymbols(object)); } if (enumerableOnly) keys = keys.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var app = (0, _express["default"])();

function multiTask(app, configPath) {
  var childWorkers = [['/webpack.client.config.js', './config/server-worker.js'], ['/webpack.client.config.js', './config/server-worker.js']].map(function (cfg) {
    var _cfg = (0, _slicedToArray2["default"])(cfg, 2),
        webpackCfg = _cfg[0],
        workerCfg = _cfg[1];

    var workerChild = _child_process["default"].fork(_path["default"].join(__dirname, workerCfg));

    workerChild.send({
      webpackConfig: "".concat(configPath).concat(webpackCfg)
    });
    workerChild.on('message', function (_ref) {
      var compiler = _ref.compiler,
          middleWareConfig = _ref.middleWareConfig;
      var devMiddleware = (0, _webpackDevMiddleware["default"])(compiler, middleWareConfig);
      app.use(devMiddleware);
    });
  });

  function killChilds() {
    childWorkers.map(function (child) {
      return child.kill();
    });
    process.exit();
  }

  process.on('SIGINT', function () {
    console.log('手动终止了进程');
    killChilds();
  });
  process.on('uncaughtException', function (code) {
    console.log("\u9000\u51FA\u7801: ".concat(code));
    killChilds();
  });
}

var readFile = function readFile(fs, file, path) {
  try {
    var filtPath = "".concat(path, "/").concat(file);
    return fs.readFileSync(filtPath, 'utf-8');
  } catch (e) {}
};

function initMiddleWare(app, configPath, port) {
  var configs = ['client', 'server'].map(function (str) {
    if (_fs["default"].existsSync(configPath)) {
      // import 动态引入需要侵入被引用框架处理，require().default问题，目前尚未在工具端找到解决方案
      // clientConfig = await import(path.resolve(process.cwd(),`${configPath}/webpack.client.config.js`));
      // serverConfig = await import(path.resolve(process.cwd(),`${configPath}/webpack.server.config.js`));
      return require(_path["default"].join(process.cwd(), "".concat(configPath, "/webpack.").concat(str, ".config.js")));
    } else {
      return (0, _default["default"])('development', str, 2);
    }
  }); // 获取webpack配置信息及devMiddleWare配置信息

  var _configs = (0, _slicedToArray2["default"])(configs, 2),
      clientConfig = _configs[0],
      serverConfig = _configs[1];

  var devConfigs = configs.map(function (config) {
    var module = config.module,
        plugins = config.plugins;
    var rules = module.rules;
    var cacheRules = rules.map(function (v) {
      var loader = v.loader,
          options = v.options,
          rest = (0, _objectWithoutProperties2["default"])(v, ["loader", "options"]);

      if (loader == 'vue-loader') {
        return _objectSpread({}, rest, {
          use: ['cache-loader', {
            loader: 'vue-loader',
            options: {
              loaders: {
                'babel-loader': 'happypack/loader?id=babel-loader' // 将loader换成happypack

              }
            }
          }]
        });
      }

      if (loader == 'babel-loader') {
        plugins.push(new _happypack["default"]({
          //用id来标识 happypack处理那里类文件
          id: loader,
          //如何处理  用法和loader 的配置一样
          loaders: ['cache-loader', {
            loader: loader,
            options: options
          }],
          //共享进程池
          threadPool: _happypack["default"].ThreadPool({
            size: _os["default"].cpus().length
          }),
          //允许 HappyPack 输出日志
          verbose: true
        }));
        return _objectSpread({}, rest, {
          use: ["happypack/loader?id=".concat(loader)]
        });
      } else {
        return v;
      }
    });
    module.rules = cacheRules;
    return _objectSpread({}, config, {
      mode: 'development',
      bail: true,
      module: module,
      plugins: plugins
    });
  });
  var compiler = (0, _webpack["default"])(devConfigs);
  compiler.plugin('done', function (stats) {
    console.log('finished package hook');
    var outPath = clientConfig.output.path;
    var clietJson = 'vue-ssr-client-manifest.json';
    var serverJson = 'vue-ssr-server-bundle.json';
    var devfs = devMiddleware.fileSystem;
    stats = stats.toJson();
    if (stats.errors.length) return;

    try {
      var clientManifest = JSON.parse(readFile(devfs, clietJson, outPath));
      var bundle = JSON.parse(readFile(devfs, serverJson, outPath));

      var templatePath = _path["default"].resolve(process.cwd(), "./dist/index.html");

      var template = _fs["default"].readFileSync(templatePath, 'utf-8');

      _chokidar["default"].watch(templatePath).on('change', function () {
        template = _fs["default"].readFileSync(templatePath, 'utf-8');
        console.log('index.html template updated.');
      });

      console.log('finished package hook1');

      require(_path["default"].resolve(process.cwd(), "./apps.js")).devServer(app, {
        bundle: bundle,
        options: {
          template: template,
          clientManifest: clientManifest
        }
      }, function () {
        app.listen(port,
        /*#__PURE__*/
        (0, _asyncToGenerator2["default"])(
        /*#__PURE__*/
        _regenerator["default"].mark(function _callee() {
          return _regenerator["default"].wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  _print["default"].log('成功启动！💪', port);

                  openUrl("http://localhost:".concat(port)); // 准备DLL库

                case 2:
                case "end":
                  return _context.stop();
              }
            }
          }, _callee);
        })));
      });
    } catch (e) {
      console.log(e);
    }
  });
  var middleWareConfig = {
    publicPath: clientConfig.output.publicPath,
    onInfo: true,
    logLevel: 'error'
  };
  var devMiddleware = (0, _webpackDevMiddleware["default"])(compiler, middleWareConfig);
  app.use(devMiddleware);
  app.use((0, _webpackHotMiddleware["default"])(compiler, {
    heartbeat: 5000
  }));
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
} // 热开发打包文件并加入内存


function ready(_x, _x2, _x3) {
  return _ready.apply(this, arguments);
}

function _ready() {
  _ready = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee2(app, configPath, port) {
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            // 选择性 使用多任务方式处理打包任务
            // TODO 进程通信问题待解决
            // if (os.cpus().length >= 2) {
            //   multiTask(app,configPath);
            // } else {
            initMiddleWare(app, configPath, port); // }

          case 1:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));
  return _ready.apply(this, arguments);
}

function preDll(configPath) {
  var dllConfig;

  if (_fs["default"].existsSync(configPath)) {
    // import 动态引入需要侵入被引用框架处理，require().default问题，目前尚未在工具端找到解决方案
    // clientConfig = await import(path.resolve(process.cwd(),`${configPath}/webpack.client.config.js`));
    // serverConfig = await import(path.resolve(process.cwd(),`${configPath}/webpack.server.config.js`));
    dllConfig = require(_path["default"].resolve(process.cwd(), "".concat(configPath, "/webpack.template.config.js")));
  } else {
    dllConfig = (0, _default["default"])('production', 'template', 1);
  }

  return new Promise(function (resolve, reject) {
    try {
      (0, _webpack["default"])(dllConfig, function () {
        _print["default"].log('DLL动态连接库及模版准备完毕！💪');

        resolve();
      });
    } catch (e) {
      _print["default"].error('动态链接库及模版打包异常', e);

      throw Error('动态链接库及模版打包异常,请联系Jerry');
    }
  });
} // 启动监听服务，并做好热开发打包文件加载进入内存


function start(_x4, _x5) {
  return _start.apply(this, arguments);
}

function _start() {
  _start = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee3(port, configPath) {
    return _regenerator["default"].wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            if (!(port > 1000)) {
              _context3.next = 6;
              break;
            }

            _context3.next = 3;
            return preDll(configPath);

          case 3:
            ready(app, configPath, port);
            _context3.next = 7;
            break;

          case 6:
            _print["default"].log('端口异常，必须大于1000', port);

          case 7:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));
  return _start.apply(this, arguments);
}