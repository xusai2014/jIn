import webpack from "webpack";
import devMiddleWare from "webpack-dev-middleware";

process.on('message', (data) => {
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
  const devMiddleware = devMiddleWare(compiler, middleWareConfig);
  process.send(devMiddleware);
});