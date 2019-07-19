import inquirer from 'inquirer';
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

function rungingInteract() {

}

export {
  packBefore,
  rungingInteract
}