import express from 'express';
import print from './print';
import webpack from "webpack";
import devMiddleWare from 'webpack-dev-middleware';
import GeneratePack from "./config/default";
import childProcess, { exec } from "child_process";
import path from 'path';
import os from 'os';// 误删除，引用注释而已
import fs from 'fs';
import webpackHotMiddleWare from 'webpack-hot-middleware';
import chokidar from 'chokidar';
import { execFile } from 'child_process';
import faster from './faster';


// 利用多worker处理打包过程，无法共享内存，待解决
function multiTask(app, configPath) {
  const childWorkers = [
    ['/webpack.client.config.js', './config/server-worker.js'],
    ['/webpack.client.config.js', './config/server-worker.js']
  ].map((cfg) => {
    const [webpackCfg, workerCfg] = cfg;
    const workerChild = childProcess.fork(path.join(__dirname, workerCfg));

    workerChild.send({webpackConfig: `${configPath}${webpackCfg}`,});

    workerChild.on('message', ({compiler, middleWareConfig}) => {
      const devMiddleware = devMiddleWare(compiler, middleWareConfig);
      app.use(devMiddleware)
    })
  });

  function killChilds() {
    childWorkers.map((child) => child.kill());
    process.exit();
  }

  process.on('SIGINT', () => {
    console.log('手动终止了进程')
    killChilds();
  })
  process.on('uncaughtException', (code) => {
    console.log(`退出码: ${code}`);
    killChilds();
  });

}

//读取文件方法，可指定文件系统
const readFile = (fs, file, path) => {
  try {
    const filtPath = `${path}/${file}`;
    return fs.readFileSync(filtPath, 'utf-8')
  } catch (e) {
  }
}


// 获取项目的webpack配置信息
function getWebpackConfigs(configPath) {
  const configs = ['client', 'server']
    .map((str) => {
      if (fs.existsSync(configPath)) {
        // import 动态引入需要侵入被引用框架处理，require().default问题，目前尚未在工具端找到解决方案
        // clientConfig = await import(path.resolve(process.cwd(),`${configPath}/webpack.client.config.js`));
        // serverConfig = await import(path.resolve(process.cwd(),`${configPath}/webpack.server.config.js`));
        const cfg = require(path.join(process.cwd(), `${configPath}/webpack.${str}.config.js`));
        if (str == 'client') {
          cfg.entry = [
            'webpack-hot-middleware/client',
            cfg.entry.app,
          ];
          cfg.plugins.push(new webpack.HotModuleReplacementPlugin());
          cfg.devtool = 'cheap-eval-source-map';
        } else {
          cfg.devtool = false;
        }
        cfg.output.filename = '[name].[hash].js';
        return cfg;
      } else {
        return GeneratePack('development', str, 2);
      }
    })
  return configs;
}


//初始化webpack middleWare
function initMiddleWare(app, configPath, port) {
  let init = false;
  let clientManifest, bundle, template;
  const appServer = require(path.join(process.cwd(), `./apps.js`));
  // 获取webpack配置信息及devMiddleWare配置信息
  let configs = getWebpackConfigs(configPath);
  const [clientConfig,serverConfig] = configs;

  clientConfig.output.path = path.join(process.cwd(),'./dist/client');
  serverConfig.output.path = path.join(process.cwd(),'./dist/server');
  const fastCfg = faster(configs)
  const compiler = webpack(fastCfg);

  const [clientCompiler,serverCompiler] = compiler.compilers;

  compiler.hooks.done.tap('done', stats => {
    const clietJson = 'vue-ssr-client-manifest.json';
    const serverJson = 'vue-ssr-server-bundle.json';
    const templatePath = path.resolve(process.cwd(), `./dist/index.html`);
    try {
      const data = stats.toJson();
      //fs.writeFile('./stats.json', JSON.stringify(data))
      if (data.errors.length > 0) throw Error('打包出现了异常');
    } catch (e) {
      console.log(e)
    }
    clientManifest = JSON.parse(readFile(clientCompiler.outputFileSystem, clietJson, clientConfig.output.path));
    bundle = JSON.parse(readFile(serverCompiler.outputFileSystem, serverJson, serverConfig.output.path));

    template = fs.readFileSync(templatePath, 'utf-8');
    chokidar.watch(templatePath).on('change', () => {
      template = fs.readFileSync(templatePath, 'utf-8')
      console.log('index.html template updated.')
    });

    if (init) {
      appServer.setRender(app, {bundle, options: {template, clientManifest}},);
      return;
    } else {
      try {
        appServer.setRender(app, {
          bundle,
          options: {
            template,
            clientManifest
          }
        }, () => {
          app.listen(port, async () => {
            print.log('成功启动！💪', port);
            init = true;
            openUrl(`http://localhost:${port}/index`);
            //rungingInteract(app,server,configPath,port);
            // 准备DLL库
          });
        });
      } catch (e) {
        console.log(e)
      }
    }

  });
  const middleWareConfig = {
    publicPath: clientConfig.output.publicPath,
    stats: {
      colors: true,
      context: process.cwd(),
    },
    watchOptions:{
      aggregateTimeout: 300,
      poll: 1000,
      ignored: /node_modules/
    }
  };
  const devMiddleware = devMiddleWare(compiler, middleWareConfig);
  app.use(devMiddleware);
  app.use(webpackHotMiddleWare(clientCompiler, {heartbeat: 3000}));

}

function openUrl(url) {
  // 拿到当前系统的参数
  switch (process.platform) {
    //mac系统使用 一下命令打开url在浏览器
    case "darwin":
      exec(`open ${url}`);
      return;
    //win系统使用 一下命令打开url在浏览器
    case "win32":
      exec(`start ${url}`);
      return;
    // 默认mac系统
    default:
      exec(`open ${url}`);
  }
}

// 热开发打包文件并加入内存
async function ready(app, configPath, port) {
  // 选择性 使用多任务方式处理打包任务
  // TODO 进程通信问题待解决
  // if (os.cpus().length >= 2) {
  //   multiTask(app,configPath);
  // } else {
  initMiddleWare(app, configPath, port);
  // }
}


// DLL文件打包及模版生成
function preDll(configPath) {
  let dllConfig, templateConfig;
  if (fs.existsSync(configPath)) {
    // import 动态引入需要侵入被引用框架处理，require().default问题，目前尚未在工具端找到解决方案
    // clientConfig = await import(path.resolve(process.cwd(),`${configPath}/webpack.client.config.js`));
    // serverConfig = await import(path.resolve(process.cwd(),`${configPath}/webpack.server.config.js`));
    dllConfig = require(path.resolve(process.cwd(), `${configPath}/webpack.dll.config.js`));

  } else {
    dllConfig = GeneratePack('production', 'template', 1);
  }
  if (fs.existsSync('./manifest.json')) {
    return new Promise((resolve, reject) => {
      try {
        templateConfig = require(path.resolve(process.cwd(), `${configPath}/webpack.template.config.js`));
        webpack(templateConfig, () => {

          print.log('DLL动态连接库及模版准备完毕！💪');
          resolve()
        })
      } catch (e) {
        print.error('动态链接库及模版打包异常', e)
        throw Error('动态链接库及模版打包异常,请联系Jerry')
      }

    })

  } else {
    return new Promise((resolve, reject) => {
      try {
        webpack(dllConfig, () => {
          templateConfig = require(path.resolve(process.cwd(), `${configPath}/webpack.template.config.js`));
          webpack(templateConfig, () => {

            print.log('DLL动态连接库及模版准备完毕！💪');
            resolve()
          })
        });
      } catch (e) {
        print.error('动态链接库及模版打包异常', e)
        throw Error('动态链接库及模版打包异常,请联系Jerry')
      }

    })
  }


}


// 启动监听服务，并做好热开发打包文件加载进入内存
async function start(port, configPath, answers) {
  const app = express();
  process.env.NODE_ENV = 'development'
  if (port > 1000) {
    await preDll(configPath);

    ready(app, configPath, port);

  } else {
    print.log('端口异常，必须大于1000', port);
  }
}

// 重新启动，热启动待修复方案
async function restart(app, configPath, port, answers) {
  process.env.NODE_ENV = 'development';
  if (port > 1000) {
    await preDll(configPath);
    ready(app, configPath, port);
  } else {
    print.log('端口异常，必须大于1000', port);
  }
}

// 打包过程
async function build(configPath, answers) {
  process.env.NODE_ENV = 'production';
  await preDll(configPath);
  const configs = getWebpackConfigs(configPath);
  try {
    webpack(configs);
  } catch (e) {
    console.log(e)
  }

}

// 分析工具
async function analyze(configPath, answers) {
  process.env.NODE_ENV = 'production'
  await preDll(configPath);
  const configs = getWebpackConfigs(configPath);
  try {
    webpack(configs, (args) => {
      console.log('******', args)
    });
  } catch (e) {
    console.log(e)
  }
}

export {
  start,
  build,
  restart,
}