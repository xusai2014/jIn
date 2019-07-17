import webpack from "webpack";
import devMiddleWare from "webpack-dev-middleware";
import path from 'path';

process.on('message', (data) => {
  try {
    const {
      webpackConfig,
    } = data;
    const config = require(path.resolve(process.cwd(),webpackConfig));

    const {
      middleWareConfig = {
        publicPath: config.output.publicPath,
        onInfo: false,
        //logLevel:'error'
      }
    } = data;

    const compiler = webpack(config);
    compiler.hooks.done.tap('WebpackDevMiddleware', (stats)=>{
      console.log(stats,'stats');
    });

    const devMiddleware = devMiddleWare(compiler, middleWareConfig);
    process.send('finished');
  } catch (e) {
    console.log(e,'紫禁城异常')
  }

});