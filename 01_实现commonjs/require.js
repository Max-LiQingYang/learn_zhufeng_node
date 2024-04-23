const path = require("path");
const fs = require("fs");
const vm = require("vm");

function Module(id) {
  this.id = id;
  this.exports = {};
}

Module._extensions = {};
Module._extensions[".js"] = function (module) {
  console.log("加载", module);
  const content = fs.readFileSync(module.id, "utf8");
  const fn = vm.compileFunction(content, [
    "exports",
    "require",
    "module",
    "__filename",
    "__dirname",
  ]); // 编译成函数, 传入固定参数

  let exports = module.exports;
  let thisValue = exports;
  let filename = module.id;
  
  Reflect.apply(fn, thisValue, [exports, req, module, filename, path.dirname(filename)]);
};
Module._extensions[".json"] = function (module) {
    const content = fs.readFileSync(module.id, "utf8");

    module.exports = JSON.parse(content);
};

// 根据后缀加载模块
Module.prototype.load = function () {
  let ext = path.extname(this.id); // js

  Module._extensions[ext](this); // 加载文件
};

// 解析文件路径
Module._resolveFileName = function (id) {
  const filepath = path.resolve(__dirname, id);
  if (fs.existsSync(filepath)) {
    return filepath;
  }

  let exts = Reflect.ownKeys(Module._extensions);
  for (let i = 0; i < exts.length; i++) {
    let newFilePath = filepath + exts[i];
    if (fs.existsSync(newFilePath)) {
      return newFilePath;
    }
  }

  throw new Error("Cannot found module");
};

function req(id) {
  // 1. 解析文件路径并添加后缀
  let filename = Module._resolveFileName(id);
  let module = new Module(filename);

  module.load(); // 加载文件, 给 module.exports 赋值

  return module.exports; // {}
}

const r = req("./a");
console.log(r);
