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

async function ready(app, configPath) {
  let clientConfig,serverConfig;
  if(fs.existsSync(configPath)){
    console.log(path.resolve(process.cwd(),`${configPath}/webpack.client.config.js`))
    clientConfig = await import(path.resolve(process.cwd(),`${configPath}/webpack.client.config.js`));
    serverConfig = await import(path.resolve(process.cwd(),`${configPath}/webpack.server.config.js`));
  } else {
    clientConfig = GeneratePack('development', 'client', 2);
    serverConfig = GeneratePack('development', 'client', 2);
  }
  if (os.cpus().length <= 2) {
    const clientWorker = childProcess.fork(path.join(__dirname,'./config/client-worker.js'));
    clientWorker.send({
      webpackConfig:clientConfig,
    });
    clientWorker.on('message', (clientMiddleware) => {
      app.use(clientMiddleware);
    })

    const serverWorker = childProcess.fork(path.join(__dirname,'./config/client-worker.js'));
    serverWorker.send({
      webpackConfig:serverConfig,
    });
    serverWorker.on('message', (serverMiddleware) => {
      app.use(serverMiddleware);
    })
  } else {
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

  console.log('webpackConfig',webpackConfig);

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

export  {
  start
}