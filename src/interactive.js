import inquirer from 'inquirer';
import { restart, start } from "./main";
/**
*   @author jerryxu
*   @methodName packBefore
*   @params mod
*   @description 打包前hook 方法
*/
const defaultList = [
  {
    type: 'list',
    message: '您选择那一个渠道入口？',
    name: 'channel',
    choices: [
      {
        name: '微信',
        value:'wechat'
      },
      {
        name: '手Q',
        value: 'qq'
      },
    ],
    validate: function(answer) {
      return true;
    }
  },
  {
    type: 'checkbox',
    message: '请选择业务模块',
    name: 'bussness',
    choices: [
      {
        name: '订机票',
        value:'booking1'
      },
      {
        name: '退机票',
        value:'booking12'
      },
    ],
    validate: function(answer) {
      return true;
    }
  }
]
function packBefore(list = defaultList) {
  return new Promise((resolve)=>{
    inquirer
      .prompt(list)
      .then(answers => {
        resolve(answers);
      });
  })
}

const analyzeList = [{
  type: 'checkbox',
  message: '请选择分析类型？',
  name: 'type',
  choices: [
    {
      name: '打包过程分析',
      value:'process'
    },
    {
      name: '打包文件分析',
      value: 'bundle'
    },
  ],
  validate: function(answer) {
    return true;
  }
},];
function analyzeBefore(list = analyzeList) {
  return new Promise((resolve)=>{
    inquirer
      .prompt(list)
      .then(answers => {
        resolve(answers);
      });
  })
}




const inputList = [
  {
    type:'input',
    message: '输入R重新选择启动选项',
    name: 'action',
    validate: function(answer) {
      return true;
    }

  },
  {
    type:'list',
    message: '重新选择入口还是模块？',
    name: 'action',
    choices: [
      {
        name: '重新选择渠道，重新启动整个应用',
        value:'channel'
      },
      {
        name: '重新选择业务模块，仅重新打包业务模块',
        value: 'bussnes'
      },
    ],
    validate: function(answer) {
      return true;
    }

  }
 ];

 function rungingInteract(app,server,configPath,port) {
  var ui = new inquirer.ui.BottomBar();
  ui.log.write('请记住，如果你想重新选择启动的入口或业务模块，请按输入重新选择！')
  inquirer.prompt(inputList).then( async (answers)=>{
    const { action } = answers;
    if( action == 'channel'){
      server.close();
      const answers = await packBefore();
      restart( app, configPath,port, answers);
    } else if(action == 'bussnes'){

    }
  })
}

export {
  packBefore,
  rungingInteract,
  analyzeBefore
}