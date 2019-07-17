import express from 'express';
import print from './print';
import webpack from "webpack";
import devMiddleWare from 'webpack-dev-middleware';
import GeneratePack from "./config/default";
import childProcess, { exec } from "child_process";
import path from 'path';
import os from 'os';
import fs from 'fs';

const app = express();

// 热开发打包文件并加入内存
async function ready(app, configPath) {
  // 选择性 使用多任务方式处理打包任务
  if (os.cpus().length >= 2) {
    const clientWorker = childProcess.fork(path.join(__dirname,'./config/client-worker.js'));

    clientWorker.send({
      webpackConfig:`${configPath}/webpack.client.config.js`,
    });
    clientWorker.on('message', (clientMiddleware) => {
      //console.log(clientWorker,'1111')
    })

    const serverWorker = childProcess.fork(path.join(__dirname,'./config/client-worker.js'));

    serverWorker.send({
      webpackConfig:`${configPath}/webpack.server.config.js`,
    });
    serverWorker.on('message', (serverMiddleware) => {
      //console.log(serverWorker,'1111')
    });


    process.on('SIGINT',()=>{
      console.log('手动终止了进程')
      clientWorker.kill();
      serverWorker.kill();
      process.exit();
    })
    process.on('uncaughtException', (code) => {
      console.log(`退出码: ${code}`);
      clientWorker.kill();
      serverWorker.kill();
      process.exit();
    });


  } else {
    let clientConfig,serverConfig;
    if(fs.existsSync(configPath)){
      // import 动态引入需要侵入被引用框架处理，require().default问题，目前尚未在工具端找到解决方案
      // clientConfig = await import(path.resolve(process.cwd(),`${configPath}/webpack.client.config.js`));
      // serverConfig = await import(path.resolve(process.cwd(),`${configPath}/webpack.server.config.js`));
      clientConfig = require(path.resolve(process.cwd(),`${configPath}/webpack.client.config.js`));
      serverConfig = require(path.resolve(process.cwd(),`${configPath}/webpack.server.config.js`));
    } else {
      clientConfig = GeneratePack('development', 'client', 2);
      serverConfig = GeneratePack('development', 'client', 2);
    }
    initMiddleWare(app, {
      webpackConfig:clientConfig
    });
    initMiddleWare(app, {
      webpackConfig:serverConfig
    });
  }

}


function initMiddleWare(app, data) {
  // 获取webpack配置信息及devMiddleWare配置信息
  const {
    webpackConfig,
  } = data;

  const {
    middleWareConfig = {
      publicPath: webpackConfig.output.publicPath,
      onInfo: false,
      //logLevel:'error'
    }
  } = data;

  const compiler = webpack(webpackConfig);
  const devMiddleware = devMiddleWare(compiler,middleWareConfig );

  app.use(devMiddleware);
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

// 启动监听服务，并做好热开发打包文件加载进入内存
function start(port,configPath) {
  if (port > 1000) {
    app.listen(port, () => {

      ready(app, configPath);

      print.log('成功启动！💪', port);

      openUrl(`http://localhost:${port}`)
    })
  } else {
    print.log('端口异常，必须大于1000', port);
  }
}

export  {
  start
}