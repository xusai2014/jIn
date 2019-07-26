/**
 *   @author jerryxu
 *   Create a Class
 *   @description 仅用于development mode
 *
 */
import path from 'path';
import * as threadLoader from 'thread-loader';


export default (configs) => {
  const stats = {
    // copied from `'minimal'`
    all: false,
    modules: true,
    maxModules: 0,
    errors: true,
    warnings: true,
    // our additional options
    moduleTrace: true,
    errorDetails: true
  }

  const devConfigs = configs.map((config, i) => {
    const {module, plugins} = config; // babel-loader

    const {rules} = module;

    const cacheRules = rules.map((v,k) => {
      const {loader = '', use, options, ...rest} = v;
      if (typeof use == 'object') {
        return {
          ...rest,
          use: [
            'cache-loader',
            ...use
          ],
        }
      }
      if (loader == 'babel-loader' || loader == 'vue-loader') {
        const optionsThread = {
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
          poolTimeout: 500,

          // number of jobs the poll distributes to the workers
          // defaults to 200
          // decrease of less efficient but more fair distribution
          poolParallelJobs: 50,

          // name of the pool
          // can be used to create different pools with elsewise identical options
          name: `loader-${i}-${k}`
        }
        //threadLoader.warmup(optionsThread,[loader]);
        return {
          ...rest,
          use: [
            'cache-loader',
            {
              loader: "thread-loader",
              options: optionsThread
            },
            {
              loader: `${loader}`,//?cacheDirectory=true
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
      mode: 'development',
      recordsPath: path.join(process.cwd(), 'records.json'),
      bail: true,
      cache: true,
      parallelism: 500,
      module,
      plugins,
      optimization: {
        minimize: false,
        usedExports: true
      },
      profile: true,
    }
  });

  return devConfigs
}