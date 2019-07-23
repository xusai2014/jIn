

/**
*   @author jerryxu
*   Create a Class
*   @description 仅用于development mode
*
*/

export default (configs)=>{
  const stats = {
    all: undefined,
    assets: true,
    assetsSort: "field",
    builtAt: true,
    cached: true,
    cachedAssets: true,
    children: true,
    chunks: true,
    chunkGroups: true,
    chunkModules: true,
    chunkOrigins: true,
    chunksSort: "field",
    colors: true,
    depth: true,
    // 通过对应的 bundle 显示入口起点
    entrypoints: true,

    // 添加 --env information
    env: true,

    errors: true,
    errorDetails: true,
    // 设置要显示的模块的最大数量
    maxModules: 15,
    modules: true,

    // 按指定的字段，对模块进行排序
    // 你可以使用 `!field` 来反转排序。默认是按照 `id` 排序。
    // Some other possible values: 'name', 'size', 'chunks', 'failed', 'issuer'
    // For a complete list of fields see the bottom of the page
    modulesSort: "field",

    // 显示警告/错误的依赖和来源（从 webpack 2.5.0 开始）
    moduleTrace: true,

    // 当文件大小超过 `performance.maxAssetSize` 时显示性能提示
    performance: true,

    // 显示模块的导出
    providedExports: false,

    // 添加 public path 的信息
    publicPath: true,

    // 添加模块被引入的原因
    reasons: true,

    // 添加模块的源码
    source: false,

    // 添加时间信息
    timings: true,

    // 显示哪个模块导出被用到
    usedExports: false,

    // 添加 webpack 版本信息
    version: true,

    // 添加警告
    warnings: true,

  }
  const devConfigs = configs.map((config,k)=>{
    const { module,plugins } = config; // babel-loader

    const { rules } = module;

    const cacheRules = rules.map((v)=>{
      const { loader = '',use, options, ...rest } = v;
      if(typeof use == 'object'){
         return {
          ...rest,
          use:[
            'cache-loader',
            {
              loader: "thread-loader",
              // loaders with equal options will share worker pools
              options: {
                // the number of spawned workers, defaults to (number of cpus - 1) or
                // fallback to 1 when require('os').cpus() is undefined
                workers: 2,

                // number of jobs a worker processes in parallel
                // defaults to 20
                workerParallelJobs: 50,

                // additional node.js arguments
                workerNodeArgs: ['--max-old-space-size=1024'],

                // Allow to respawn a dead worker pool
                // respawning slows down the entire compilation
                // and should be set to false for development
                poolRespawn: false,

                // timeout for killing the worker processes when idle
                // defaults to 500 (ms)
                // can be set to Infinity for watching builds to keep workers alive
                poolTimeout: 2000,

                // number of jobs the poll distributes to the workers
                // defaults to 200
                // decrease of less efficient but more fair distribution
                poolParallelJobs: 50,

                // name of the pool
                // can be used to create different pools with elsewise identical options
                name: loader
              }
            },
            ...use
          ],
        }
      }
      if(loader == 'babel-loader'|| loader == 'vue-loader'){
        return {
          ...rest,
          use:[
            'cache-loader',
            {
              loader: "thread-loader",
              // loaders with equal options will share worker pools
              options: {
                // the number of spawned workers, defaults to (number of cpus - 1) or
                // fallback to 1 when require('os').cpus() is undefined
                workers: 2,

                // number of jobs a worker processes in parallel
                // defaults to 20
                workerParallelJobs: 50,

                // additional node.js arguments
                workerNodeArgs: ['--max-old-space-size=1024'],

                // Allow to respawn a dead worker pool
                // respawning slows down the entire compilation
                // and should be set to false for development
                poolRespawn: false,

                // timeout for killing the worker processes when idle
                // defaults to 500 (ms)
                // can be set to Infinity for watching builds to keep workers alive
                poolTimeout: 2000,

                // number of jobs the poll distributes to the workers
                // defaults to 200
                // decrease of less efficient but more fair distribution
                poolParallelJobs: 50,

                // name of the pool
                // can be used to create different pools with elsewise identical options
                name: loader
              }
            },
            {
              loader:`${loader}`,//?cacheDirectory=true
              options,
            }
          ],
        }
      } else {
        return v;
      }
    });
    module.rules = cacheRules;
    return {
      ...config,
      mode:'development',
      bail:true,
      cache:true,
      module,
      plugins,
      stats,
      profile:true,
    }
  });
  return devConfigs
}