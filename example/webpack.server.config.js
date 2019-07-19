var path = require('path');
module.exports = {
  entry: path.join(__dirname,'./index.js'),
  output: {
    publicPath: "/",
    filename: "bundle.js"
  },
  mode:'development',
  target: "node"
}