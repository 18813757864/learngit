/**
 * <%= enName %>项目配置文件
 * author by <%= authorName %>
 * TODO:jspConfigs的配置对象根据自己实际需求配置
 */
module.exports = {
  //环境
  env: "jsp",
  // jsp打包配置(支持多个根路径)
  jspConfigs: [
    {
      // 来源
      sourcePath: "static",
      // 忽略目录
      exclude: ["components"],
      // 目标
      targetPath: "distStatic",
      // 是否有less文件
      hasLess: false,
      // 是否开启es6(注意:开启es6转译的时候js文件大小不能超过500kb,不然编译报错)
      isEs6: true,
      // 是否压缩图片(这个操作需要大量的时间,所以一般是在上线的时候只操作一次)
      miniPhotos: false
    }
  ]
};
