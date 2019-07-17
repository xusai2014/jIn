#!/usr/bin/env node
const server = require('./lib/server');
require('yargs')
  .command('serve [port] [configPath]','启动本地开发服务',(yargs)=>{
    yargs.positional('port',{
      describe:'服务占用端口',
      default:5000
    })
  },(argv)=>{
    if(argv.verbose) console.log(`服务启动，端口：${argv.port}`)
    server.start(argv.port,argv.configPath);
  })
  .option('verbose', {
    alias: 'v',
    default: false
  })
  .argv;

