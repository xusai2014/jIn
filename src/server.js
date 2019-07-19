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
import HappyPack from 'happypack';

const app = express();


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

function initMiddleWare(app, configPath,port) {
  let configs = ['client','server']
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

  // 获取webpack配置信息及devMiddleWare配置信息
  const [ clientConfig,serverConfig ] = configs;
  const devConfigs = configs.map((config)=>{
    const { module,plugins } = config;
    const { rules } = module;
    const cacheRules = rules.map((v)=>{
      const { loader,options, ...rest } = v;
      if(loader == 'vue-loader'){
        return {
          ...rest,
          use:[
            'cache-loader',
            {
              loader: 'vue-loader',
              options: {
                loaders: {
                  'babel-loader': 'happypack/loader?id=babel-loader' // 将loader换成happypack
                }
              }
            }
          ],

        }
      }
      if(loader == 'babel-loader'){
        plugins.push(
          new HappyPack({
            //用id来标识 happypack处理那里类文件
            id: loader,
            //如何处理  用法和loader 的配置一样
            loaders: [
              'cache-loader',
              {
                loader,
                options,
              }],
            //共享进程池
            threadPool: HappyPack.ThreadPool({ size: os.cpus().length }),
            //允许 HappyPack 输出日志
            verbose: true,
          })

        );

        return {
          ...rest,
          use:[`happypack/loader?id=${loader}`],
        }
      } else {
        return v;
      }

    });
    module.rules = cacheRules
    return {
      ...config,
      mode:'development',
      bail:true,
      module,
      plugins,
    }
  });

  const compiler = webpack(devConfigs);


  compiler.plugin('done', stats => {
    console.log('finished package hook');
    const outPath = clientConfig.output.path;
    const clietJson = 'vue-ssr-client-manifest.json';
    const serverJson = 'vue-ssr-server-bundle.json';
    const devfs = devMiddleware.fileSystem;

    stats = stats.toJson()
    if (stats.errors.length) return;

    try {
      const clientManifest = JSON.parse(readFile(devfs, clietJson,outPath));

      const bundle = JSON.parse(readFile(devfs, serverJson,outPath));
      const templatePath = path.resolve(process.cwd(),`./dist/index.html`);
      let template = fs.readFileSync(templatePath, 'utf-8');
      chokidar.watch(templatePath).on('change', () => {
        template = fs.readFileSync(templatePath, 'utf-8')
        console.log('index.html template updated.')
      })
      console.log('finished package hook1');
      require(path.resolve(process.cwd(),`./apps.js`)).devServer(app,{
        bundle,
        options:{
          template,
          clientManifest
        }
      },()=>{
        app.listen(port, async () => {
          print.log('成功启动！💪', port);
          openUrl(`http://localhost:${port}`);
          // 准备DLL库
        })
      });
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
    //win系统使用 一下命令打开url在浏览器
    case "win32":
      exec(`start ${url}`);
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
async function  start(port,configPath) {
  if (port > 1000) {
    await preDll(configPath);

    ready(app, configPath, port);

  } else {
    print.log('端口异常，必须大于1000', port);
  }
}



export  {
  start
}