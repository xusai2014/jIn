/**
*   @author jerryxu
*   Create a Class
*   @description 仅用于development mode
*
*/
import path from 'path';


export default (configs)=>{
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
            },
            {
              loader:`${loader}`,//?cacheDirectory=true
              options,
            }
          ],
          sideEffects:true,
        }
      } else {
        return v;
      }
    });
    module.rules = cacheRules;
    return {
      ...config,
      mode:'development',
     recordsPath: path.join(process.cwd(), 'records.json'),
      bail:true,
      cache:true,
      parallelism:500,
      module,
      plugins,
     stats:'verbose',
     optimization:{
         minimize: false,
         usedExports: true
       },
      profile:true,
    }
  });

  return devConfigs
}