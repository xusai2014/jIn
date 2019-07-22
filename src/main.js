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
import { analyzeBefore,rungingInteract } from "./interactive";




function multiTask(app,configPath) {
  const childWorkers = [
    ['/webpack.client.config.js','./config/server-worker.js'],
    ['/webpack.client.config.js','./config/server-worker.js']
  ].map((cfg)=>{
    const [ webpackCfg, workerCfg] = cfg;
    const workerChild = childProcess.fork(path.join(__dirname,workerCfg));

    workerChild.send({webpackConfig:`${configPath}${webpackCfg}`,});

    workerChild.on('message', ({compiler,middleWareConfig}) => {
      const devMiddleware = devMiddleWare(compiler,middleWareConfig );
      app.use(devMiddleware)
    })
  });
  function killChilds(){
    childWorkers.map((child)=>child.kill());
    process.exit();
  }
  process.on('SIGINT',()=>{
    console.log('手动终止了进程')
    killChilds();
  })
  process.on('uncaughtException', (code) => {
    console.log(`退出码: ${code}`);
    killChilds();
  });

}

const readFile = (fs, file, path) => {
  try {
    const filtPath = `${path}/${file}`;
    return fs.readFileSync(filtPath, 'utf-8')
  } catch (e) {}
}

function getWebpackConfigs(configPath) {
  const configs = ['client','server']
    .map((str)=>{
      if(fs.existsSync(configPath)){
        // import 动态引入需要侵入被引用框架处理，require().default问题，目前尚未在工具端找到解决方案
        // clientConfig = await import(path.resolve(process.cwd(),`${configPath}/webpack.client.config.js`));
        // serverConfig = await import(path.resolve(process.cwd(),`${configPath}/webpack.server.config.js`));
        return require(path.join(process.cwd(),`${configPath}/webpack.${str}.config.js`));
      } else {
        return GeneratePack('development', str, 2);
      }
    })
  return configs;
}

function initMiddleWare(app, configPath,port) {
  let configs = getWebpackConfigs(configPath);

  // 获取webpack配置信息及devMiddleWare配置信息
  const [ clientConfig ] = configs;

  const compiler = webpack(faster(configs));

  compiler.hooks.done.tap('done',stats => {
    const outPath = clientConfig.output.path;
    const clietJson = 'vue-ssr-client-manifest.json';
    const serverJson = 'vue-ssr-server-bundle.json';
    const devfs = devMiddleware.fileSystem;
    try {
      const data = stats.toJson();
      //fs.writeFile('./stats.json', JSON.stringify(data))
      if (data.errors.length>0) throw Error('打包出现了异常');
    } catch (e) {
      console.log(e)
    }
    try {
      const clientManifest = JSON.parse(readFile(devfs, clietJson,outPath));

      const bundle = JSON.parse(readFile(devfs, serverJson,outPath));
      const templatePath = path.resolve(process.cwd(),`./dist/index.html`);

      let template = fs.readFileSync(templatePath, 'utf-8');

      chokidar.watch(templatePath).on('change', () => {
        template = fs.readFileSync(templatePath, 'utf-8')
        console.log('index.html template updated.')
      });

      console.log('finished package hook1');
      const appServer = require(path.join(process.cwd(),`./apps.js`));
      try {
        appServer.devServer(app,{
          bundle,
          options:{
            template,
            clientManifest
          }
        },()=>{

          const server = app.listen(port, async () => {
            print.log('成功启动！💪', port);
            openUrl(`http://localhost:${port}`);
            rungingInteract(app,server,configPath,port);
            // 准备DLL库
          });

        });
      } catch (e) {
        console.log(e)
      }

    } catch (e) {
      console.log(e)
    }
  });

  const middleWareConfig = {
    publicPath: clientConfig.output.publicPath,
    onInfo: true,
    logLevel:'error'
  };
  const devMiddleware = devMiddleWare(compiler,middleWareConfig );


  app.use(devMiddleware);
  app.use(webpackHotMiddleWare(compiler, { heartbeat: 5000 }));

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

function preDll(configPath) {
  let dllConfig;
  if(fs.existsSync(configPath)){
    // import 动态引入需要侵入被引用框架处理，require().default问题，目前尚未在工具端找到解决方案
    // clientConfig = await import(path.resolve(process.cwd(),`${configPath}/webpack.client.config.js`));
    // serverConfig = await import(path.resolve(process.cwd(),`${configPath}/webpack.server.config.js`));
    dllConfig = require(path.resolve(process.cwd(),`${configPath}/webpack.template.config.js`));
  } else {
    dllConfig = GeneratePack('production', 'template', 1);
  }

  return new Promise((resolve,reject)=>{
    try {
      webpack(dllConfig,()=>{
        print.log('DLL动态连接库及模版准备完毕！💪');
        resolve()
      });
    } catch (e) {
      print.error('动态链接库及模版打包异常',e)
      throw Error('动态链接库及模版打包异常,请联系Jerry')
    }

  })
}

// 启动监听服务，并做好热开发打包文件加载进入内存
async function  start(port,configPath,answers) {
  const app = express();
  process.env.NODE_ENV = 'development'
  if (port > 1000) {
    await preDll(configPath);

    ready(app, configPath, port);

  } else {
    print.log('端口异常，必须大于1000', port);
  }
}

async function restart(app,configPath,port,answers) {
  process.env.NODE_ENV = 'development'
  if (port > 1000) {
    await preDll(configPath);

    ready(app, configPath, port);

  } else {
    print.log('端口异常，必须大于1000', port);
  }
}

async function build(configPath, answers) {
  process.env.NODE_ENV = 'production'
  await preDll(configPath);
  const configs = getWebpackConfigs(configPath);
  try {
    webpack(configs,(args)=>{
      console.log('******',args)
    });
  } catch (e) {
    console.log(e)
  }

}

async function analyze(configPath, answers) {
  process.env.NODE_ENV = 'production'
  await preDll(configPath);
  const configs = getWebpackConfigs(configPath);
  try {
    webpack(configs,(args)=>{
      console.log('******',args)
    });
  } catch (e) {
    console.log(e)
  }
}

export  {
  start,
  build,
  restart,
}