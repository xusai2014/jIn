#!/usr/bin/env node
import { packBefore,analyzeBefore } from "./interactive";

import { start,build,analyze } from './main';
import yargs from 'yargs';
import { pathExist } from "./utils";

yargs.command(`start <configPath> [port]`, '启动本地开发服务', (yargs) => {
  yargs.positional('configPath', {
    describe: '指定打包配置文件入口路径，如不明确请阅读开发文档',
  });
  yargs.positional('port', {
    describe: '服务占用端口',
    default: 5000
  });
}, async (argv) => {
  if (argv.configPath) {
    const isExsit = await pathExist(argv.configPath)
    if (isExsit) {
      const answers = await packBefore();
      start(argv.port, argv.configPath, answers);
    } else {
      console.log('请检查打包配置文件入口路径')
    }
  } else {
    console.log(`请指定文件入口`, argv);
  }
}).command(`build <configPath>`, '生产打包', (yargs) => {
  yargs.positional('configPath', {
    describe: '指定打包配置文件入口路径，如不明确请阅读开发文档',
  });
}, async (argv) => {
  if (argv.configPath) {
    const isExsit = await pathExist(argv.configPath)
    if (isExsit) {
      const answers = await packBefore();
      build(argv.configPath, answers)
    } else {
      console.log('请检查打包配置文件入口路径')
    }
  } else {
    console.log(`请指定打包配置文件入口路径`);
  }
}).command(`analyze <configPath>`, '打包分析工具', (yargs) => {
  yargs.positional('configPath', {
    describe: '指定打包配置文件入口路径，如不明确请阅读开发文档',
  });
}, async (argv) => {
  if (argv.configPath) {
    const isExsit = await pathExist(argv.configPath)
    if (isExsit) {
      const answers = await analyzeBefore();
      analyze(argv.configPath, answers)
    } else {
      console.log('请检查打包配置文件入口路径')
    }
  } else {
    console.log(`请指定打包配置文件入口路径`);
  }
})
  .help('help')
  .argv;

