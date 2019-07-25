## 神奇的打包器

### 背景
为了实现前端框架的工具化、产品化，提高前端业务开发效率，提供稳定、高质量开发体验，故而开发了这个打包器


!!! VUE + SSR 解决方案在热开发过程中，会随着业务规模、方案复杂度，导致项目臃肿，可维护性变差。故而抽离打包器作为一个基础工具，提供一致接口。

打包方案是Webpack社区提供的多方面的提升效率方案

## 使用

本地开发模式
```
$ cd YourProject
$ yarn add jin-pack --dev
$ jIn start ./build

// build 文件夹下存放 template 配置文件，client配置文件， server 配置文件
// 指定启动文件即app.js,

```


生产打包模式
```
$ cd YourProject
$ yarn add jin-pack --dev
$ jIn build ./build

// build 文件夹下存放 template 配置文件，client配置文件， server 配置文件
```

