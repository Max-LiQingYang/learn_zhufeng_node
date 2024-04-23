## commonJS require('模块路径') 源码步骤

1. Module.\_load 加载这个模块
2. Module_resolveFilename() 处理路径为绝对路径，并且添加文件后缀
3. 拿到文件, 看一下文件是否加载过. Module.\_cache 是否缓存过, 如果缓存过直接结束
4. 如果没有缓存过 则会 new Module(id.exports = {}). exports 是对应模块的导出结果, 默认为空
5. 将创建的模块缓存
6. 根据文件加载模块 (给 module.exports 赋值)
7. 找到对应文件后缀 做加载操作 Module.\_extensions[.js](this, filename); 策略模式
8. 读取文件内容 fs.readFileSync(filename, 'utf8');
9. 将字符串执行, module.\_compile 编译字符串
10. 将字符串包裹成函数, 传参: 'exports', 'require', 'module', '**filename', '**dirname'
11. module.exports = exports;
    this = exports;
    Reflect.apply(this, [exports, require, module, filename, path.dirname]); module.exports = 'abc'
    将函数执行后的结果赋值给模块的 this.exports 即为 module.exports
12. 最终返回的是 module.exports
