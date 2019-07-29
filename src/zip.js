import path from 'path';
import fs from 'fs';
import {exec} from 'child_process';

export default function fileDisplay (imagePath){
  const filePath = path.join(process.cwd(), imagePath);
  fs.readdir(filePath,(err,files)=>{
    if(err) console.log('读取文件异常',err);
    exec(`npx imagemin ${filePath}/*.{jpg,png} --out-dir=${filePath}/`, function (err, stdout, stderr) {
      if (err) {
        console.log('imagemin failed to minfy the imagefile err:' + stderr);
      } else {
        console.log(imagePath,'压缩图片成功！', stdout);
        files.forEach((filename)=>{
          const filedir = path.join(imagePath,filename);
          //根据文件路径获取文件信息，返回一个fs.Stats对象
          fs.stat(filedir,function(eror,stats){
            if(eror){
              console.warn('获取文件stats失败');
            }else{
              const isFile = stats.isFile();//是文件
              const isDir = stats.isDirectory();//是文件夹
              if(isFile){
                return;
              }
              if(isDir){
                return fileDisplay(filedir);//递归，如果是文件夹，就继续遍历该文件夹下面的文件
              }
            }
          })
        })
      }
    });

  })
}

