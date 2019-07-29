## 神奇的打包器

### 背景
为了实现前端框架的工具化、产品化，提高前端业务开发效率，提供稳定、高质量开发体验，故而开发了这个打包器


VUE + SSR解决方案在热开发过程中，会随着业务规模、方案复杂度，导致项目臃肿，本地开发效率变慢。故而抽离打包器作为一个基础工具，提供一致接口。

打包方案是Webpack社区提供的多方面的提升效率方案

## 使用

本地开发模式
```
$ cd YourProject
$ yarn add jin-pack --dev
$ ./node_modules/.bin/jIn start ./build

// build 文件夹下存放 template 配置文件，client配置文件， server 配置文件
// 指定启动文件即app.js,

```


生产打包模式
```
$ cd YourProject
$ yarn add jin-pack --dev
$ ./node_modules/.bin/jIn build ./build

// build 文件夹下存放 template 配置文件，client配置文件， server 配置文件
```


图片压缩工具
～～ 批量压缩，如遇多彩图片请使用其它工具压缩 ～～
```
$ cd YourProject
$ yarn add jin-pack --dev
$ ./node_modules/.bin/jIn zip ./src/images

```


### Interface

目录接口
项目根路径下提供自定义的webpack配置文件，为提高本地开发效率，本地开发时会自动配置本地开发的，效率方案：

具体如下:

./build

    webpack.client.config.js

    webpack.server.config.js

    webpack.template.config.js

    webpack.dll.config.js

 apps.js

 需修改，apps.js,暴露动态设置vue服务端渲染render函数,并加载 express 配置项
