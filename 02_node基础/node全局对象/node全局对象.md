## node 全局对象

浏览器有的几乎都有.

exports, require, module, **dirname, **filename 这五个对象虽然不是全局对象, 但是可以直接访问.

除此之外.

- process 进程对象
  - nextTick
  - cwd 与 path.resolve() 相同, 都是获取当前工作路径
  - chdir() 改变当前工作路径
  - env 环境变量. windows 下使用 set 来设置环境变量, mac 用 export 来设置环境变量
  - argv






















