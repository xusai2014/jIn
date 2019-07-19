#!/usr/bin/env node
const server = require('./lib/server');
require('yargs')
  // .command('$0', 'the default command', () => {}, (argv) => {
  //   console.log('this command will be run by default')
  // })
  .command(`start <configPath> [port]`,'启动本地开发服务',(yargs)=>{
    yargs.positional('port',{
      describe:'服务占用端口',
      default:5000
    })
  },(argv)=>{
    if(argv.verbose) console.log(`服务启动，端口：${argv.port}`)
    server.start(argv.port,argv.configPath);
  })
  // .option('channel',{
  //   alias:'ch',
  //   describe: '选择入口渠道',
  // })
  // .option('verbose', {
  //   alias: 'v',
  //   default: false
  // })
  // .choices('ch',['kylinwechat','kylintouch'])
  .help('help')
  .argv;

